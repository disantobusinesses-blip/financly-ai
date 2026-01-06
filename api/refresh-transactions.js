import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

let cachedToken = null;
let cachedTokenExpMs = 0;

async function getFiskilToken() {
  mustEnv("FISKIL_CLIENT_ID", FISKIL_CLIENT_ID);
  mustEnv("FISKIL_CLIENT_SECRET", FISKIL_CLIENT_SECRET);

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpMs - 15_000) return cachedToken;

  const r = await fetch(`${FISKIL_BASE_URL}/token`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ client_id: FISKIL_CLIENT_ID, client_secret: FISKIL_CLIENT_SECRET }),
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
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
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

function extractList(resp, preferredKey) {
  if (Array.isArray(resp)) return resp;
  if (preferredKey && Array.isArray(resp?.[preferredKey])) return resp[preferredKey];
  for (const k of ["accounts", "transactions", "data", "items", "results"]) {
    if (Array.isArray(resp?.[k])) return resp[k];
    if (Array.isArray(resp?.data?.[k])) return resp.data[k];
  }
  return [];
}

const parseAmount = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const m = v.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (m?.[0]) return Number(m[0]) || 0;
  }
  if (v && typeof v === "object") {
    const o = v;
    return parseAmount(o.current ?? o.available ?? o.amount ?? o.value ?? o.balance ?? 0);
  }
  return 0;
};

function normaliseAccount(a, appUserId) {
  return {
    id: String(a?.id),
    user_id: appUserId,
    name: a?.name ?? a?.display_name ?? a?.displayName ?? a?.product_name ?? a?.productName ?? "Account",
    type: a?.type ?? a?.account_type ?? a?.accountType ?? "checking",
    currency: a?.currency ?? a?.currency_code ?? a?.currencyCode ?? "AUD",
    balance: parseAmount(
      a?.balance?.current ??
        a?.balance?.available ??
        a?.balance ??
        a?.current_balance ??
        a?.currentBalance ??
        a?.available_balance ??
        a?.availableBalance ??
        0
    ),
    raw: a,
    updated_at: new Date().toISOString(),
  };
}

function normaliseTx(t, appUserId, fallbackAccountId) {
  const accountId = String(t?.account_id || t?.accountId || fallbackAccountId || "");
  const rawDate =
    t?.date ??
    t?.posted_at ??
    t?.postedAt ??
    t?.timestamp ??
    t?.created_at ??
    t?.createdAt ??
    null;

  const isoDate = (() => {
    if (!rawDate) return null;
    const d = new Date(rawDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    if (typeof rawDate === "string") return rawDate;
    return null;
  })();

  return {
    id: String(t?.id),
    user_id: appUserId,
    account_id: accountId,
    amount: parseAmount(t?.amount ?? t?.value ?? t?.transaction_amount ?? t?.transactionAmount ?? null),
    date: isoDate,
    description: t?.description ?? t?.narrative ?? t?.merchant_name ?? t?.merchantName ?? "Transaction",
    category: t?.category ?? t?.category_name ?? t?.categoryName ?? null,
    raw: t,
  };
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

    // 1) Accounts
    const accountsResp = await fiskilGet(`/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`);
    const fiskilAccounts = extractList(accountsResp, "accounts").filter((a) => a && a.id);

    if (!fiskilAccounts.length) {
      console.log("⏳ Fiskil accounts not ready", { appUserId, endUserId });
      return res.status(202).json({
        success: false,
        pending: true,
        reason: "accounts_not_ready",
        message:
          "Bank connection succeeded but accounts are not available yet. This is normal while Fiskil completes the initial sync.",
        retry_after_seconds: 8,
      });
    }

    // 2) Transactions
    const fromQuery = profile.last_transactions_sync_at
      ? `&from=${encodeURIComponent(profile.last_transactions_sync_at)}`
      : "";

    let fiskilTransactions = [];
    try {
      const txResp = await fiskilGet(`/banking/transactions?end_user_id=${encodeURIComponent(endUserId)}${fromQuery}`);
      fiskilTransactions = extractList(txResp, "transactions").filter((t) => t && t.id);
    } catch {
      fiskilTransactions = [];
    }

    if (!fiskilTransactions.length) {
      // fallback per-account
      const from = profile.last_transactions_sync_at
        ? `?from=${encodeURIComponent(profile.last_transactions_sync_at)}`
        : "";
      for (const acc of fiskilAccounts) {
        const accountId = acc.id;
        const txResp = await fiskilGet(`/banking/accounts/${encodeURIComponent(accountId)}/transactions${from}`);
        const txList = extractList(txResp, "transactions").filter((t) => t && t.id);
        fiskilTransactions.push(...txList.map((t) => ({ ...t, account_id: t.account_id || accountId })));
      }
    }

    const accountsRows = fiskilAccounts.map((a) => normaliseAccount(a, appUserId));
    const transactionsRows = fiskilTransactions.map((t) => normaliseTx(t, appUserId, t?.account_id));

    // Upsert
    const nowIso = new Date().toISOString();

    if (accountsRows.length) {
      const { error: upsertAccErr } = await supabaseAdmin
        .from("accounts")
        .upsert(accountsRows, { onConflict: "id" });
      if (upsertAccErr) return res.status(500).json({ error: "Accounts upsert failed", details: upsertAccErr.message });
    }

    if (transactionsRows.length) {
      const { error: upsertTxErr } = await supabaseAdmin
        .from("transactions")
        .upsert(transactionsRows, { onConflict: "id" });
      if (upsertTxErr) return res.status(500).json({ error: "Transactions upsert failed", details: upsertTxErr.message });
    }

    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({
        last_transactions_sync_at: nowIso,
        has_bank_connection: true,
        updated_at: nowIso,
      })
      .eq("id", appUserId);

    if (updErr) return res.status(500).json({ error: "Profile update failed", details: updErr.message });

    console.log("✅ refresh-transactions complete", {
      appUserId,
      endUserId,
      fetched_accounts: accountsRows.length,
      fetched_transactions: transactionsRows.length,
    });

    return res.status(200).json({
      success: true,
      pending: false,
      fetched_accounts: accountsRows.length,
      fetched_transactions: transactionsRows.length,
      synced_at: nowIso,
    });
  } catch (err) {
    console.error("❌ /api/refresh-transactions error:", err);
    return res.status(500).json({
      error: "Unable to refresh transactions",
      details: String(err?.message || err),
    });
  }
}
