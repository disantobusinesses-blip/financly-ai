import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FISKIL_BASE_URL = process.env.FISKIL_BASE_URL || "https://api.fiskil.com";
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

function mustEnv(name, value) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toV1 = (base) => {
  const b = normalizeBase(base);
  return /\/v1$/i.test(b) ? b : `${b}/v1`;
};
const FISKIL_V1_BASE = toV1(FISKIL_BASE_URL);

const supabaseAdmin = (() => {
  mustEnv("SUPABASE_URL", SUPABASE_URL);
  mustEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
})();

let cachedToken = null;
let cachedTokenExpMs = 0;

async function getFiskilToken() {
  mustEnv("FISKIL_CLIENT_ID", FISKIL_CLIENT_ID);
  mustEnv("FISKIL_CLIENT_SECRET", FISKIL_CLIENT_SECRET);

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpMs - 15_000) return cachedToken;

  const r = await fetch(`${FISKIL_V1_BASE}/token`, {
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
  const url = `${FISKIL_V1_BASE}${pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`}`;

  const r = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  const text = await r.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!r.ok) throw new Error(`Fiskil GET ${pathWithQuery} failed (${r.status}): ${text}`);
  return json;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1) Verify Supabase session
    const authHeader = req.headers.authorization || "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!bearer) return res.status(401).json({ error: "Missing Authorization header" });

    const { data: userResp, error: userErr } = await supabaseAdmin.auth.getUser(bearer);
    if (userErr || !userResp?.user) return res.status(401).json({ error: "Invalid session" });

    const appUserId = userResp.user.id;

    // 2) Get Fiskil end_user_id from profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("fiskil_user_id, has_bank_connection, last_transactions_sync_at")
      .eq("id", appUserId)
      .maybeSingle();

    if (profileErr) throw profileErr;

    const endUserId = profile?.fiskil_user_id || null;
    const connected = Boolean(profile?.has_bank_connection) || Boolean(endUserId);

    if (!endUserId) {
      return res.status(200).json({
        connected: false,
        accounts: [],
        transactions: [],
        last_updated: null,
        debug: { reason: "missing_fiskil_user_id" },
      });
    }

    // 3) Fetch directly from Fiskil
    // Accounts: /v1/banking/accounts?end_user_id=... (common Fiskil pattern)
    const accountsResp = await fiskilGet(`/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`);
    const accounts = accountsResp?.accounts || accountsResp?.data || accountsResp || [];

    // Transactions: /v1/banking/transactions?end_user_id=... (docs mention this endpoint) :contentReference[oaicite:4]{index=4}
    const txResp = await fiskilGet(`/banking/transactions?end_user_id=${encodeURIComponent(endUserId)}`);
    const transactions = txResp?.transactions || txResp?.data || txResp || [];

    // NOTE: Fiskil requires waiting for initial sync completion webhooks before data appears for some domains. :contentReference[oaicite:5]{index=5}
    return res.status(200).json({
      connected,
      end_user_id: endUserId,
      accounts: Array.isArray(accounts) ? accounts : [],
      transactions: Array.isArray(transactions) ? transactions : [],
      last_updated: profile?.last_transactions_sync_at || null,
      debug: {
        accounts_type: typeof accountsResp,
        transactions_type: typeof txResp,
        has_bank_connection: Boolean(profile?.has_bank_connection),
      },
    });
  } catch (e) {
    return res.status(500).json({
      error: "fiskil-data failed",
      details: String(e?.message || e),
    });
  }
}
