import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FISKIL_BASE_URL = process.env.FISKIL_BASE_URL;
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

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toFiskilV1Base = (base) => {
  const resolved = normalizeBase(base || "https://api.fiskil.com");
  return /\/v1$/i.test(resolved) ? resolved : `${resolved}/v1`;
};

const FISKIL_V1_BASE = toFiskilV1Base(FISKIL_BASE_URL);

function getBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h) return null;
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

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
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: r.status, body: data };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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
      .select("fiskil_user_id")
      .eq("id", appUserId)
      .maybeSingle();

    if (profErr) return res.status(500).json({ error: profErr.message });
    if (!profile?.fiskil_user_id) {
      return res.status(400).json({ error: "No connected bank: missing profiles.fiskil_user_id" });
    }

    const endUserId = profile.fiskil_user_id;

    const accountsResp = await fiskilGet(`/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`);
    const transactionsResp = await fiskilGet(
      `/banking/transactions?end_user_id=${encodeURIComponent(endUserId)}`
    );

    console.log("✅ /api/debug-fiskil-direct", {
      appUserId,
      endUserId,
      accountsStatus: accountsResp.status,
      transactionsStatus: transactionsResp.status,
    });

    return res.status(200).json({
      fiskil_base_url: FISKIL_V1_BASE,
      end_user_id: endUserId,
      accounts_status: accountsResp.status,
      accounts_body: accountsResp.body,
      transactions_status: transactionsResp.status,
      transactions_body: transactionsResp.body,
    });
  } catch (err) {
    console.error("❌ /api/debug-fiskil-direct error:", err);
    return res.status(500).json({ error: "Unable to debug Fiskil direct", details: String(err?.message || err) });
  }
}
