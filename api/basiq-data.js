// 🚀 REPLACEMENT FOR: /api/basiq-data.js
// Live-only. Optional jobId polling. Retries. Clear errors.

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

const DEMO_ACCOUNTS = [
  {
    id: "demo-checking",
    name: "Everyday Spending Account",
    class: "transaction",
    balance: 3264.52,
    availableBalance: 3124.52,
    currency: "AUD",
  },
  {
    id: "demo-savings",
    name: "High Interest Saver",
    class: "saver",
    balance: 12840.33,
    currency: "AUD",
  },
  {
    id: "demo-mortgage",
    name: "Home Loan",
    class: "mortgage",
    balance: -412350.23,
    currency: "AUD",
  },
];

const DEMO_TRANSACTIONS = [
  {
    id: "demo-tx-1",
    accountId: "demo-checking",
    description: "Coles Supermarket",
    amount: -84.32,
    date: new Date().toISOString(),
    category: "groceries",
  },
  {
    id: "demo-tx-2",
    accountId: "demo-checking",
    description: "Opal Transport",
    amount: -46.6,
    date: new Date(Date.now() - 86400000).toISOString(),
    category: "transport",
  },
  {
    id: "demo-tx-3",
    accountId: "demo-checking",
    description: "Salary - Acme Pty Ltd",
    amount: 4200,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    category: "income",
  },
  {
    id: "demo-tx-4",
    accountId: "demo-savings",
    description: "Automatic Transfer",
    amount: 500,
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    category: "transfer",
  },
  {
    id: "demo-tx-5",
    accountId: "demo-mortgage",
    description: "Mortgage Repayment",
    amount: -2450,
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    category: "mortgage",
  },
];

function respondWithDemo(res, reason) {
  if (reason) {
    console.warn("ℹ️ Falling back to demo Basiq payload:", reason);
  }

  return res.status(200).json({
    mode: "demo",
    accounts: DEMO_ACCOUNTS,
    transactions: DEMO_TRANSACTIONS,
  });
}

let CACHED_SERVER_TOKEN = null;
let SERVER_TOKEN_EXPIRY = 0;

function normalizedBasicKey() {
  if (!BASIQ_API_KEY) throw new Error("Missing BASIQ_API_KEY env var");
  const raw = BASIQ_API_KEY.trim();
  return raw.startsWith("Basic ") ? raw : `Basic ${raw}`;
}

async function getServerToken() {
  const now = Date.now();
  if (CACHED_SERVER_TOKEN && now < SERVER_TOKEN_EXPIRY) return CACHED_SERVER_TOKEN;

  const res = await fetch(`${BASIQ_API_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: normalizedBasicKey(),
      "Content-Type": "application/x-www-form-urlencoded",
      "basiq-version": "3.0",
    },
    body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to get server token: ${t}`);
  }
  const { access_token } = await res.json();
  CACHED_SERVER_TOKEN = access_token;
  SERVER_TOKEN_EXPIRY = now + 55 * 60 * 1000;
  return CACHED_SERVER_TOKEN;
}

async function fetchJSON(url, headers, retries = 2) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return await res.json();
  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return fetchJSON(url, headers, retries - 1);
    }
    throw e;
  }
}

async function pollJobUntilDone(jobId, serverToken, maxAttempts = 12, delayMs = 2500) {
  for (let i = 0; i < maxAttempts; i++) {
    const data = await fetchJSON(`${BASIQ_API_URL}/jobs/${jobId}`, {
      Authorization: `Bearer ${serverToken}`,
      "basiq-version": "3.0",
    });
    const status = data?.status;
    if (status === "success") return data;
    if (status === "failed") throw new Error(`Basiq job failed: ${JSON.stringify(data?.result || {})}`);
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error("Timed out waiting for Basiq job to finish");
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  if (!BASIQ_API_KEY) {
    return respondWithDemo(res, "Missing BASIQ_API_KEY env var");
  }

  try {
    const userId = String(req.query?.userId || "").trim();
    const jobId = req.query?.jobId ? String(req.query.jobId) : null;

    if (!userId) return res.status(400).json({ error: "Missing Basiq userId" });

    const SERVER_TOKEN = await getServerToken();

    // If jobId present from redirect, wait for it to complete before fetching data
    if (jobId) {
      try {
        await pollJobUntilDone(jobId, SERVER_TOKEN);
      } catch (e) {
        // Continue to try fetching data, but include hint in response
        console.warn("⚠️ job polling warning:", e?.message || e);
      }
    }

    const [accountsData, transactionsData] = await Promise.all([
      fetchJSON(`${BASIQ_API_URL}/users/${encodeURIComponent(userId)}/accounts`, {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "basiq-version": "3.0",
      }),
      fetchJSON(`${BASIQ_API_URL}/users/${encodeURIComponent(userId)}/transactions`, {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "basiq-version": "3.0",
      }),
    ]);

    return res.status(200).json({
      mode: "live",
      accounts: accountsData?.data || [],
      transactions: transactionsData?.data || [],
    });
  } catch (err) {
    console.error("❌ /api/basiq-data error:", err);
    return respondWithDemo(res, err?.message || err);
  }
}
