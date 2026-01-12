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

function normalizeBase(url) {
  return String(url || "").replace(/\/$/, "");
}
function toV1(base) {
  const b = normalizeBase(base || "https://api.fiskil.com");
  return /\/v1$/i.test(b) ? b : `${b}/v1`;
}

function getBearerToken(req) {
  const h = req.headers?.authorization;
  if (!h) return null;
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

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

  const v1 = toV1(FISKIL_BASE_URL);

  const r = await fetch(`${v1}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
      grant_type: "client_credentials",
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

  const token = data?.token || data?.access_token;
  const expiresIn = Number(data?.expires_in ?? 900);

  if (!token) throw new Error(`Fiskil token missing in response: ${text}`);

  cachedToken = token;
  cachedTokenExpMs = now + expiresIn * 1000;
  return cachedToken;
}

async function fiskilGet(path) {
  const v1 = toV1(FISKIL_BASE_URL);
  const token = await getFiskilToken();

  const r = await fetch(`${v1}${path}`, {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
  });

  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!r.ok) throw new Error(`Fiskil GET ${path} failed (${r.status}): ${text}`);
  return data;
}

function computeSyncStatus({ connected, accountCount, txCount, waitingForWebhook }) {
  if (!connected) return { stage: "no_connection", progress: 0, message: "Bank not connected yet." };

  if (waitingForWebhook) {
    return { stage: "awaiting_accounts", progress: 35, message: "Waiting for bank data (Fiskil sync)..." };
  }

  if (accountCount === 0) return { stage: "awaiting_accounts", progress: 35, message: "Waiting for accounts..." };
  if (txCount === 0) return { stage: "awaiting_transactions", progress: 60, message: "Waiting for transactions..." };

  return { stage: "ready", progress: 100, message: "Bank data loaded." };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method Not Allowed" });

  try {
    const jwt = getBearerToken(req);
    if (!jwt) return sendJson(res, 401, { error: "Missing auth" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) return sendJson(res, 401, { error: "Invalid auth" });

    const userId = userData.user.id;

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("has_bank_connection,fiskil_user_id,last_transactions_sync_at")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) throw new Error(profErr.message);

    const connected = Boolean(profile?.has_bank_connection) && Boolean(profile?.fiskil_user_id);
    const endUserId = profile?.fiskil_user_id || null;

    if (!connected || !endUserId) {
      return sendJson(res, 200, {
        connected: false,
        accounts: [],
        transactions: [],
        last_updated: null,
        syncStatus: computeSyncStatus({ connected: false, accountCount: 0, txCount: 0, waitingForWebhook: false }),
        debugInfo: { reason: "no_connection", end_user_id: endUserId },
      });
    }

    const lastWebhookAt = profile?.last_transactions_sync_at || null;
    const force = String(req.query?.force || "") === "1";

    // If webhook hasn’t arrived yet, don’t hammer Fiskil. Show waiting state.
    if (!lastWebhookAt && !force) {
      return sendJson(res, 200, {
        connected: true,
        accounts: [],
        transactions: [],
        last_updated: null,
        syncStatus: computeSyncStatus({
          connected: true,
          accountCount: 0,
          txCount: 0,
          waitingForWebhook: true,
        }),
        debugInfo: { end_user_id: endUserId, last_transactions_sync_at: null, note: "waiting_for_webhook" },
      });
    }

    // Fetch directly from Fiskil
    const accountsResp = await fiskilGet(`/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`);
    const rawAccounts = Array.isArray(accountsResp?.accounts) ? accountsResp.accounts : Array.isArray(accountsResp) ? accountsResp : [];

    // pull last 90 days by default
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const fromStr = from.toISOString().slice(0, 10);

    const txResp = await fiskilGet(
      `/banking/transactions?end_user_id=${encodeURIComponent(endUserId)}&from=${encodeURIComponent(fromStr)}`
    );
    const rawTx = Array.isArray(txResp?.transactions) ? txResp.transactions : Array.isArray(txResp) ? txResp : [];

    const syncStatus = computeSyncStatus({
      connected: true,
      accountCount: rawAccounts.length,
      txCount: rawTx.length,
      waitingForWebhook: false,
    });

    return sendJson(res, 200, {
      connected: true,
      accounts: rawAccounts,
      transactions: rawTx,
      last_updated: new Date().toISOString(),
      syncStatus,
      debugInfo: {
        end_user_id: endUserId,
        last_transactions_sync_at: lastWebhookAt,
        accounts_count: rawAccounts.length,
        transactions_count: rawTx.length,
      },
    });
  } catch (err) {
    console.error("fiskil-data error:", err);
    return sendJson(res, 500, { error: "fiskil-data failed", details: String(err?.message || err) });
  }
}
