import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FISKIL_BASE_URL = process.env.FISKIL_BASE_URL || "https://api.fiskil.com";
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

const MAX_TRANSACTIONS = 200;
const RECENT_SAMPLE = 25;
const LAST_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SUBSCRIPTION_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;

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

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toV1 = (base) => {
  const b = normalizeBase(base);
  return /\/v1$/i.test(b) ? b : `${b}/v1`;
};
const FISKIL_V1_BASE = toV1(FISKIL_BASE_URL);

let cachedToken = null;
let cachedTokenExpMs = 0;

function getBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h) return null;
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

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

function asArray(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.items)) return resp.items;
  if (Array.isArray(resp?.transactions)) return resp.transactions;
  if (Array.isArray(resp?.accounts)) return resp.accounts;
  return [];
}

function normaliseAccount(a) {
  return {
    id: String(a?.id || ""),
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
  };
}

function normaliseTx(t) {
  return {
    id: String(t?.id || ""),
    amount: t?.amount ?? t?.value ?? t?.transaction_amount ?? t?.transactionAmount ?? 0,
    date: t?.date ?? t?.posted_at ?? t?.postedAt ?? t?.timestamp ?? t?.created_at ?? t?.createdAt ?? null,
    description: t?.description ?? t?.narrative ?? t?.merchant_name ?? t?.merchantName ?? "Transaction",
    category: t?.category ?? t?.category_name ?? t?.categoryName ?? null,
  };
}

const toAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeLabel = (value, fallback) => {
  const cleaned = String(value || "").trim();
  return cleaned || fallback;
};

const sortByDateDesc = (a, b) => {
  const aTime = new Date(a?.date || 0).getTime();
  const bTime = new Date(b?.date || 0).getTime();
  return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
};

const getDateMs = (value) => {
  const ms = new Date(value || 0).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

function summariseTransactions(transactions = []) {
  const now = Date.now();
  const windowStart = now - LAST_30_DAYS_MS;

  let income = 0;
  let spending = 0;

  const merchantTotals = new Map();
  const categoryTotals = new Map();
  const expenses = [];

  transactions.forEach((tx) => {
    const amount = toAmount(tx.amount);
    const dateMs = getDateMs(tx.date);

    if (dateMs >= windowStart) {
      if (amount > 0) income += amount;
      if (amount < 0) spending += Math.abs(amount);
    }

    if (amount < 0) {
      const merchant = normalizeLabel(tx.description, "Unknown merchant");
      const category = normalizeLabel(tx.category, "Uncategorized");
      merchantTotals.set(merchant, (merchantTotals.get(merchant) || 0) + Math.abs(amount));
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + Math.abs(amount));
      expenses.push({
        date: tx.date,
        description: merchant,
        amount: Math.abs(amount),
        category,
      });
    }
  });

  const topMerchants = [...merchantTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([merchant, total]) => ({ merchant, total }));

  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, total]) => ({ category, total }));

  const biggestExpenses = expenses
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((expense) => ({
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
    }));

  return {
    totalsLast30Days: {
      income: Number(income.toFixed(2)),
      spending: Number(spending.toFixed(2)),
      net: Number((income - spending).toFixed(2)),
    },
    topMerchants,
    topCategories,
    biggestExpenses,
  };
}

function buildSubscriptionSummary(transactions = []) {
  const lookbackStart = Date.now() - SUBSCRIPTION_LOOKBACK_MS;
  const groups = new Map();

  transactions.forEach((tx) => {
    const amount = toAmount(tx.amount);
    if (amount >= 0) return;
    const dateMs = getDateMs(tx.date);
    if (dateMs < lookbackStart) return;

    const merchant = normalizeLabel(tx.description, "Unknown merchant").toLowerCase();
    if (!merchant) return;

    const bucket = groups.get(merchant) || [];
    bucket.push({ date: tx.date, amount: Math.abs(amount), category: tx.category });
    groups.set(merchant, bucket);
  });

  const subscriptions = [];
  groups.forEach((items, merchant) => {
    if (items.length < 2) return;
    const amounts = items.map((item) => item.amount);
    const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const varianceOk = avg > 0 && (max - min) / avg <= 0.15;
    if (!varianceOk) return;

    const sorted = [...items].sort((a, b) => getDateMs(b.date) - getDateMs(a.date));
    subscriptions.push({
      merchant,
      averageAmount: Number(avg.toFixed(2)),
      lastChargeDate: sorted[0]?.date || null,
      occurrences: items.length,
      category: sorted[0]?.category || null,
    });
  });

  return subscriptions
    .sort((a, b) => b.averageAmount - a.averageAmount)
    .slice(0, 5)
    .map((sub) => ({
      name: sub.merchant,
      averageAmount: sub.averageAmount,
      lastChargeDate: sub.lastChargeDate,
      occurrences: sub.occurrences,
      category: sub.category,
      note: "Inferred recurring charges based on recent activity.",
    }));
}

async function fetchSupabaseFinance(appUserId) {
  const { data: accounts, error: accErr } = await supabaseAdmin
    .from("accounts")
    .select("id,name,type,balance,currency")
    .eq("user_id", appUserId);

  if (accErr) throw accErr;

  const { data: transactions, error: txErr } = await supabaseAdmin
    .from("transactions")
    .select("id,amount,date,description,category")
    .eq("user_id", appUserId)
    .order("date", { ascending: false })
    .limit(MAX_TRANSACTIONS);

  if (txErr) throw txErr;

  return {
    accounts: Array.isArray(accounts) ? accounts : [],
    transactions: Array.isArray(transactions) ? transactions : [],
  };
}

async function fetchFiskilFinance(endUserId) {
  if (!endUserId) return { accounts: [], transactions: [] };

  const accountsResp = await fiskilGet(`/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`);
  const accounts = asArray(accountsResp).map(normaliseAccount);

  const txResp = await fiskilGet(`/banking/transactions?end_user_id=${encodeURIComponent(endUserId)}`);
  const transactions = asArray(txResp).map(normaliseTx);

  return {
    accounts: accounts.filter((acc) => acc.id),
    transactions: transactions.filter((tx) => tx.id),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  if (!openai) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const jwt = getBearerToken(req);
    if (!jwt) return res.status(401).json({ error: "Missing Authorization header" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) return res.status(401).json({ error: "Invalid session" });

    const appUserId = userData.user.id;

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("fiskil_user_id")
      .eq("id", appUserId)
      .maybeSingle();

    if (profileErr) throw profileErr;

    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const quickAction = typeof body.quickAction === "string" ? body.quickAction.trim() : "";
    const region = body?.context?.region ? String(body.context.region) : "US";

    const prompt = message || quickAction;
    if (!prompt) return res.status(400).json({ error: "message is required" });

    let financeData = await fetchSupabaseFinance(appUserId);
    if (!financeData.transactions.length && !financeData.accounts.length) {
      financeData = await fetchFiskilFinance(profile?.fiskil_user_id || null);
    }

    const sortedTransactions = [...(financeData.transactions || [])].sort(sortByDateDesc).slice(0, MAX_TRANSACTIONS);
    const usedTransactionCount = sortedTransactions.length;

    if (!financeData.accounts.length && !sortedTransactions.length) {
      return res.status(200).json({
        answer:
          "I don't see enough MyAiBank data yet. Please refresh your accounts or reconnect your bank so I can help.",
        meta: { usedTransactionCount: 0 },
      });
    }

    const summary = summariseTransactions(sortedTransactions);
    const subscriptions = buildSubscriptionSummary(sortedTransactions);

    const recentTransactions = sortedTransactions.slice(0, RECENT_SAMPLE).map((tx) => ({
      date: tx.date,
      description: normalizeLabel(tx.description, "Transaction"),
      amount: Number(toAmount(tx.amount).toFixed(2)),
      category: normalizeLabel(tx.category, "Uncategorized"),
    }));

    const accounts = (financeData.accounts || []).map((account) => ({
      name: normalizeLabel(account.name, "Account"),
      type: normalizeLabel(account.type, "checking"),
      balance: Number(toAmount(account.balance).toFixed(2)),
      currency: normalizeLabel(account.currency, "AUD"),
    }));

    const financeSummary = {
      region,
      generatedAt: new Date().toISOString(),
      accounts,
      totalsLast30Days: summary.totalsLast30Days,
      topMerchants: summary.topMerchants,
      topCategories: summary.topCategories,
      biggestExpenses: summary.biggestExpenses,
      subscriptions,
      recentTransactions,
      usedTransactionCount,
    };

    const systemPrompt =
      "You are MyAiBank Mascot Assistant. Only answer about the user's MyAiBank finances using the provided data summary. " +
      "No unrelated topics, no fun facts, and no generic financial advice beyond basic budgeting tips. " +
      "Always cite numbers from the data summary when possible. " +
      "If data is missing or insufficient, ask the user to refresh/reconnect and say you don't see enough data.";

    const response = await openai.chat.completions.create({
      model: openaiModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `User message: ${prompt}\n\nData summary JSON:\n${JSON.stringify(financeSummary)}`,
        },
      ],
    });

    const answer = response.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      answer: answer ||
        "I can only help with your MyAiBank finances. Ask about spending, income, bills, subscriptions, or saving tips.",
      meta: { usedTransactionCount },
    });
  } catch (error) {
    console.error("Mascot chat error", error);
    return res.status(500).json({ error: "Unable to generate reply" });
  }
}
