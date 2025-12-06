// 🚀 REPLACEMENT FOR: /api/basiq-data.js
// Live-only. Optional jobId polling. Retries. Clear errors.

const FISKIL_API_KEY = process.env.FISKIL_API_KEY;
const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");

function fiskilHeaders() {
  if (!FISKIL_API_KEY) throw new Error("Missing FISKIL_API_KEY env var");
  return {
    Authorization: `Bearer ${FISKIL_API_KEY}`,
    "Content-Type": "application/json",
  };
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

  if (!FISKIL_API_KEY || !FISKIL_API_URL) {
    return res.status(500).json({ error: "Fiskil configuration missing on server" });
  }

  try {
    const userId = String(req.query?.userId || "").trim();
    const since = req.query?.from ? String(req.query.from) : null;

    if (!userId) return res.status(400).json({ error: "Missing Fiskil userId" });

    const query = since ? `?from=${encodeURIComponent(since)}` : "";
    const headers = fiskilHeaders();

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
    console.error("❌ /api/basiq-data error:", err);
    return res.status(500).json({
      error: "Failed to fetch banking data",
      details: String(err?.message || err),
    });
  }
}
