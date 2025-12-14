import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FISKIL_BASE_URL = (process.env.FISKIL_BASE_URL || "https://api.fiskil.com/v1").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

function mustEnv(name, value) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const supabaseAdmin = (() => {
  mustEnv("SUPABASE_URL", SUPABASE_URL);
  mustEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
})();

function getBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h) return null;
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

// Fiskil token cache (per warm lambda instance)
let cachedToken = null;
let cachedTokenExpMs = 0;

async function getFiskilToken() {
  mustEnv("FISKIL_CLIENT_ID", FISKIL_CLIENT_ID);
  mustEnv("FISKIL_CLIENT_SECRET", FISKIL_CLIENT_SECRET);

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpMs - 15_000) return cachedToken;

  const r = await fetch(`${FISKIL_BASE_URL}/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
    }),
  });

  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!r.ok) throw new Error(`Fiskil token failed (${r.status}): ${text}`);

  const token = data?.token;
  const expiresIn = Number(data?.expires_in ?? 600);
  if (!token) throw new Error(`Fiskil token missing in response: ${text}`);

  cachedToken = token;
  cachedTokenExpMs = now + expiresIn * 1000;
  return cachedToken;
}

async function fiskilGet(pathWithQuery) {
  const token = await getFiskilToken();
  const url = `${FISKIL_BASE_URL}${pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`}`;

  const r = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!r.ok) throw new Error(`Fiskil GET ${pathWithQuery} failed (${r.status}): ${text}`);

  return data;
}

export default async function handler(req, res) {
  try {
    const jwt = getBearerToken(req);
    if (!jwt) return res.status(401).json({ error: "Missing auth" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const appUserId = userData.user.id;

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("fiskil_user_id,last_transactions_sync_at")
      .eq("id", appUserId)
      .maybeSingle();

    if (profErr) return res.status(500).json({ error: profErr.message });
    if (!profile?.fiskil_user_id) return res.status(400).json({ error: "No connected bank" });

    const endUserId = profile.fiskil_user_id;

    // Fetch accounts + transactions scoped to end_user_id
    const accountsResp = await fiskilGet(
      `/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`
    );

    const from = profile.last_transactions_sync_at
      ? `&from=${encodeURIComponent(profile.last_transactions_sync_at)}`
      : "";

    const transactionsResp = await fiskilGet(
      `/banking/transactions?end_user_id=${encodeURIComponent(endUserId)}${from}`
    );

    const accounts = Array.isArray(accountsResp) ? accountsResp : accountsResp?.data || [];
    const transactions = Array.isArray(transactionsResp) ? transactionsResp : transactionsResp?.data || [];

    return res.status(200).json({ accounts, transactions });
  } catch (error) {
    return res.status(500).json({
      error: "Fiskil data error",
      details: String(error?.message || error),
    });
  }
}