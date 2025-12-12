// api/fiskil-data.js
// Fetch accounts + transactions for a Fiskil end_user_id

const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

let cachedToken = null;
let cachedExpiry = 0;

function ensureConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
}

async function getAccessToken() {
  ensureConfig();

  const now = Date.now();
  if (cachedToken && cachedExpiry > now + 5000) return cachedToken;

  // ✅ Correct Fiskil auth
  const res = await fetch(`${FISKIL_API_URL}/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.access_token) {
    throw new Error(
      `Fiskil token error (${res.status}): ${json ? JSON.stringify(json) : "no json"}`
    );
  }

  cachedToken = json.access_token;
  cachedExpiry = now + Number(json.expires_in || 0) * 1000;
  return cachedToken;
}

async function fiskilGet(path) {
  const token = await getAccessToken();
  const url = `${FISKIL_API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  const text = await res.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // keep text
  }

  if (!res.ok) {
    console.error("Fiskil GET error", { url, status: res.status, body });
    throw new Error(
      `Fiskil request failed (${res.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`
    );
  }

  return body;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // Expect: /api/fiskil-data?userId=<end_user_id>&from=YYYY-MM-DD (optional)
    const userId = String(req.query?.userId || "").trim();
    const from = req.query?.from ? String(req.query.from).trim() : null;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // NOTE: Exact Fiskil data endpoints can vary by product.
    // These match your earlier attempts but with correct auth.
    const txQuery = from ? `?from=${encodeURIComponent(from)}` : "";

    const [accountsResp, transactionsResp] = await Promise.all([
      fiskilGet(`/banking/v2/users/${encodeURIComponent(userId)}/accounts`),
      fiskilGet(`/banking/v2/users/${encodeURIComponent(userId)}/transactions${txQuery}`),
    ]);

    const accounts = Array.isArray(accountsResp?.data)
      ? accountsResp.data
      : accountsResp?.accounts || [];

    const transactions = Array.isArray(transactionsResp?.data)
      ? transactionsResp.data
      : transactionsResp?.transactions || [];

    return res.status(200).json({ mode: "live", accounts, transactions });
  } catch (error) {
    return res.status(500).json({
      error: "Fiskil data error",
      detail: String(error?.message || error),
    });
  }
}