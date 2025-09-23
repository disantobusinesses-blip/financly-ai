// api/basiq-data.js
import { demoAccounts, demoTransactions } from "../src/demo/demoData";

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId } = req.query;

  // ✅ DEMO MODE if no ID or invalid ID
  if (!userId || !userId.startsWith("u-")) {
    return res.status(200).json({
      mode: "demo",
      accounts: demoAccounts,
      transactions: demoTransactions,
    });
  }

  // --- REAL BASIQ MODE ---
  try {
    if (!BASIQ_API_KEY) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: BASIQ_API_KEY missing." });
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
      const errorText = await tokenRes.text();
      return res.status(500).json({
        error: "Failed to get BASIQ token",
        details: errorText,
      });
    }

    const { access_token: SERVER_TOKEN } = await tokenRes.json();

    // Step 2: Fetch accounts
    const accountsRes = await fetch(
      `${BASIQ_API_URL}/users/${userId}/accounts`,
      {
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "basiq-version": "3.0",
        },
      }
    );

    if (!accountsRes.ok) {
      const errorText = await accountsRes.text();
      return res.status(500).json({
        error: "Failed to fetch accounts",
        details: errorText,
      });
    }

    const accountsData = await accountsRes.json();

    // Step 3: Fetch transactions
    const txRes = await fetch(
      `${BASIQ_API_URL}/users/${userId}/transactions`,
      {
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "basiq-version": "3.0",
        },
      }
    );

    if (!txRes.ok) {
      const errorText = await txRes.text();
      return res.status(500).json({
        error: "Failed to fetch transactions",
        details: errorText,
      });
    }

    const transactionsData = await txRes.json();

    return res.status(200).json({
      mode: "live",
      accounts: accountsData.data || [],
      transactions: transactionsData.data || [],
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
}
