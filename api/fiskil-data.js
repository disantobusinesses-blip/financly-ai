// Fiskil data retrieval handler
const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

let cachedToken = null;
let cachedExpiry = 0;

function ensureFiskilConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
}

async function getFiskilAccessToken() {
  ensureFiskilConfig();
  const now = Date.now();
  if (cachedToken && cachedExpiry > now + 5000) return cachedToken;

  const res = await fetch(`${FISKIL_API_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fiskil token request failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  cachedToken = json.access_token;
  cachedExpiry = now + (json.expires_in ? json.expires_in * 1000 : 0);
  return cachedToken;
}

async function fetchJSON(url, headers, retries = 2) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const contentType = res.headers.get("content-type") || "";
    return contentType.includes("application/json") ? await res.json() : await res.text();
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return fetchJSON(url, headers, retries - 1);
    }
    throw e;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    return res.status(500).json({ error: "Fiskil configuration missing on server" });
  }

  try {
    const token = await getFiskilAccessToken();
    const userId = String(req.query?.userId || "").trim();
    const since = req.query?.from ? String(req.query.from) : null;

    if (!userId) return res.status(400).json({ error: "Missing Fiskil userId" });

    const query = since ? `?from=${encodeURIComponent(since)}` : "";
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const [accountsData, transactionsData] = await Promise.all([
      fetchJSON(`${FISKIL_API_URL}/banking/v2/users/${encodeURIComponent(userId)}/accounts`, headers),
      fetchJSON(
        `${FISKIL_API_URL}/banking/v2/users/${encodeURIComponent(userId)}/transactions${query}`,
        headers
      ),
    ]);

    return res.status(200).json({
      mode: "live",
      accounts: Array.isArray(accountsData?.data) ? accountsData.data : accountsData?.accounts || [],
      transactions: Array.isArray(transactionsData?.data)
        ? transactionsData.data
        : transactionsData?.transactions || [],
    });
  } catch (err) {
    console.error("❌ /api/fiskil-data error:", err);
    return res.status(500).json({
      error: "Failed to fetch banking data",
      details: String(err?.message || err),
    });
  }
}
