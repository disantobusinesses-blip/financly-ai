import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// IMPORTANT:
// Env FISKIL_BASE_URL should be an origin (e.g. https://api.fiskil.com).
const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toFiskilV1Base = (base) => {
  const b = normalizeBase(base || "https://api.fiskil.com");
  return /\/v1$/i.test(b) ? b : `${b}/v1`;
};

const FISKIL_BASE_URL = toFiskilV1Base(process.env.FISKIL_BASE_URL);
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

  if (!r.ok) {
    throw new Error(`Fiskil GET ${pathWithQuery} failed (${r.status}): ${text}`);
  }

  return data;
}

function normaliseAccount(a, appUserId) {
  return {
    id: String(a?.id),
    user_id: appUserId,
    name: a?.name ?? a?.display_name ?? a?.displayName ?? a?.product_name ?? a?.productName ?? "Account",
    type: a?.type ?? a?.account_type ?? a?.accountType ?? "checking",
    currency: a?.currency ?? a?.currency_code ?? a?.currencyCode ?? "AUD",
    balance:
      a?.balance?.current ??
      a?.balance?.available ??
      a?.balance ??
      a?.current_balance ??
      a?.currentBalance ??
      a?.available_balance ??
      a?.availableBalance ??
      0,
    raw: a,
    updated_at: new Date().toISOString(),
  };
}

function normaliseTx(t, appUserId, accountId) {
  return {
    id: String(t?.id),
    user_id: appUserId,
    account_id: String(accountId || t?.account_id || t?.accountId || ""),
    amount: t?.amount ?? t?.value ?? t?.transaction_amount ?? t?.transactionAmount ?? null,
    date: t?.date ?? t?.posted_at ?? t?.postedAt ?? t?.timestamp ?? t?.created_at ?? t?.createdAt ?? null,
    description: t?.description ?? t?.narrative ?? t?.merchant_name ?? t?.merchantName ?? "Transaction",
    category: t?.category ?? t?.category_name ?? t?.categoryName ?? null,
    raw: t,
  };
}

function asArray(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const jwt = getBearerToken(req);
    if (!jwt) return res.status(401).json({ error: "Missing auth" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) return res.status(401).json({ error: "Invalid session" });

    const appUserId = userData.user.id;

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("fiskil_user_id,last_transactions_sync_at")
      .eq("id", appUserId)
      .maybeSingle();

    if (profErr) return res.status(500).json({ error: profErr.message });
    if (!profile?.fiskil_user_id) return res.status(400).json({ error: "No connected bank" });

    const endUserId = profile.fiskil_user_id;

    // 1) Fetch accounts for the end user
    const accountsResp = await fiskilGet(`/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`);
    const fiskilAccounts = asArray(accountsResp).filter((a) => a && a.id);

    if (!fiskilAccounts.length) {
      return res.status(200).json({ success: true, imported_accounts: 0, imported_transactions: 0 });
    }

    // 2) Upsert accounts into Supabase
    const accountsRows = fiskilAccounts.map((a) => normaliseAccount(a, appUserId));
    const { error: upsertAccErr } = await supabaseAdmin.from("accounts").upsert(accountsRows, {
      onConflict: "id",
    });
    if (upsertAccErr) return res.status(500).json({ error: upsertAccErr.message });

    // 3) For each account, fetch transactions (optionally from last sync time)
    const from = profile.last_transactions_sync_at
      ? `?from=${encodeURIComponent(profile.last_transactions_sync_at)}`
      : "";

    let allTransactions = [];
    for (const acc of fiskilAccounts) {
      const accountId = acc.id;
      // Common Fiskil pattern: /banking/accounts/{account_id}/transactions
      const txResp = await fiskilGet(`/banking/accounts/${encodeURIComponent(accountId)}/transactions${from}`);
      const txList = asArray(txResp).filter((t) => t && t.id);
      allTransactions.push(...txList.map((t) => normaliseTx(t, appUserId, accountId)));
    }

    // 4) Upsert transactions
    if (allTransactions.length) {
      const { error: upsertTxErr } = await supabaseAdmin.from("transactions").upsert(allTransactions, {
        onConflict: "id",
      });
      if (upsertTxErr) return res.status(500).json({ error: upsertTxErr.message });
    }

    // 5) Update profile sync timestamp
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({
        last_transactions_sync_at: new Date().toISOString(),
        has_bank_connection: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appUserId);

    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.status(200).json({
      success: true,
      imported_accounts: fiskilAccounts.length,
      imported_transactions: allTransactions.length,
    });
  } catch (err) {
    console.error("❌ /api/refresh-transactions error:", err);
    return res.status(500).json({
      error: "Unable to refresh transactions",
      details: String(err?.message || err),
    });
  }
}
