// api/basiq-data.js
const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Missing Basiq userId" });
  }

  try {
    if (!BASIQ_API_KEY) {
      return res.status(500).json({
        error: "Server misconfigured: BASIQ_API_KEY missing.",
      });
    }

    // Step 1: Get server token
    const tokenRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${BASIQ_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Failed to get BASIQ token: ${errText}`);
    }

    const { access_token: SERVER_TOKEN } = await tokenRes.json();

    // Step 2: Fetch accounts and transactions
    const [accountsRes, txRes] = await Promise.all([
      fetch(`${BASIQ_API_URL}/users/${userId}/accounts`, {
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "basiq-version": "3.0",
        },
      }),
      fetch(`${BASIQ_API_URL}/users/${userId}/transactions`, {
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "basiq-version": "3.0",
        },
      }),
    ]);

    const accountsData = await accountsRes.json();
    const transactionsData = await txRes.json();

    res.status(200).json({
      mode: "live",
      accounts: accountsData.data || [],
      transactions: transactionsData.data || [],
    });
  } catch (err) {
    console.error("❌ Basiq fetch error:", err);
    res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
}
