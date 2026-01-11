import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toFiskilV1Base = (base) => {
  const resolved = normalizeBase(base || "https://api.fiskil.com");
  return /\/v1$/i.test(resolved) ? resolved : `${resolved}/v1`;
};

const FISKIL_V1_BASE = toFiskilV1Base(process.env.FISKIL_BASE_URL);
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

// Fiskil token cache (per warm lambda)
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
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { ok: r.ok, status: r.status, body, rawText: text };
}

function asArray(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
}

function sampleAccount(raw) {
  return {
    id: raw?.id ?? null,
    name: raw?.name ?? raw?.accountName ?? raw?.displayName ?? null,
    type: raw?.type?.text ?? raw?.type ?? raw?.accountType ?? null,
    balance: raw?.balance?.current ?? raw?.balance ?? raw?.amount ?? null,
    currency: raw?.currency ?? null,
  };
}

function sampleTransaction(raw) {
  return {
    id: raw?.id ?? null,
    account_id: raw?.account_id ?? raw?.accountId ?? null,
    description: raw?.description ?? raw?.merchant?.name ?? null,
    amount: raw?.amount ?? null,
    date: raw?.date ?? raw?.postedAt ?? raw?.transactionDate ?? null,
  };
}

function buildSamples(items, mapper) {
  const list = Array.isArray(items) ? items.slice(0, 2) : [];
  return list.map(mapper);
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
      .select("fiskil_user_id,has_bank_connection")
      .eq("id", appUserId)
      .maybeSingle();

    if (profErr) return res.status(500).json({ error: profErr.message });

    if (!profile?.fiskil_user_id) {
      return res.status(200).json({
        connected: false,
        end_user_id: null,
        accounts: [],
        transactions: [],
        last_updated: null,
        source: "fiskil",
        debug: {
          fiskil_base_url: FISKIL_V1_BASE,
          endpoints: { accounts: null, transactions: null },
          status: { accounts: null, transactions: null },
          samples: { accounts: [], transactions: [] },
        },
      });
    }

    const endUserId = profile.fiskil_user_id;
    const accountsPath = `/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`;
    const transactionsPath = `/banking/transactions?end_user_id=${encodeURIComponent(endUserId)}`;

    const accountsResp = await fiskilGet(accountsPath);
    const txResp = await fiskilGet(transactionsPath);

    const accounts = accountsResp.ok ? asArray(accountsResp.body).filter((a) => a && a.id) : [];
    const transactions = txResp.ok ? asArray(txResp.body).filter((t) => t && t.id) : [];

    return res.status(200).json({
      connected: true,
      end_user_id: endUserId,
      accounts,
      transactions,
      last_updated: new Date().toISOString(),
      source: "fiskil",
      debug: {
        fiskil_base_url: FISKIL_V1_BASE,
        endpoints: { accounts: accountsPath, transactions: transactionsPath },
        status: { accounts: accountsResp.status, transactions: txResp.status },
        samples: {
          accounts: buildSamples(accountsResp.body, sampleAccount),
          transactions: buildSamples(txResp.body, sampleTransaction),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Fiskil data error",
      details: String(error?.message || error),
    });
  }
}
