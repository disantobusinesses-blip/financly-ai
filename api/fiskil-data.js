// Fiskil banking data fetcher

import { fetchUserAccounts, fetchUserTransactions } from "../src/lib/fiskilClient";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const customerId = String(req.query?.userId || "").trim();

    if (!customerId) return res.status(400).json({ error: "Missing Fiskil customer id" });

    const [accountsData, transactionsData] = await Promise.all([
      fetchUserAccounts(customerId),
      fetchUserTransactions(customerId),
    ]);

    return res.status(200).json({
      mode: "live",
      accounts: accountsData || [],
      transactions: transactionsData || [],
    });
  } catch (err) {
    console.error("❌ /api/fiskil-data error:", err);
    return res.status(500).json({
      error: "Failed to fetch banking data",
      details: String(err?.message || err),
    });
  }
}
