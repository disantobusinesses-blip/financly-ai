import { demoAccounts, demoTransactions } from "./demoData.js";

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId } = req.query;

  // ✅ Demo mode if no valid userId
  if (!userId || typeof userId !== "string" || !userId.startsWith("u-")) {
    return res.status(200).json({
      mode: "demo",
      accounts: demoAccounts,
      transactions: demoTransactions,
    });
  }

  try {
    if (!BASIQ_API_KEY) {
      return res.status(500).json({ error: "Server misconfigured: BASIQ_API_KEY missing." });
    }

    // Step 1: Server token
    const tokenRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${BASIQ_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
    });
    if (!tokenRes.ok) throw new Error(await tokenRes.text());
    const { access_token: SERVER_TOKEN } = await tokenRes.json();

    // Step 2: Accounts
    const accountsRes = await fetch(`${BASIQ_API_URL}/users/${userId}/accounts`, {
      headers: { Authorization: `Bearer ${SERVER_TOKEN}`, "basiq-version": "3.0" },
    });
    if (!accountsRes.ok) throw new Error(await accountsRes.text());
    const accountsData = await accountsRes.json();

    // Step 3: Transactions
    const txRes = await fetch(`${BASIQ_API_URL}/users/${userId}/transactions`, {
      headers: { Authorization: `Bearer ${SERVER_TOKEN}`, "basiq-version": "3.0" },
    });
    if (!txRes.ok) throw new Error(await txRes.text());
    const transactionsData = await txRes.json();

    return res.status(200).json({
      mode: "live",
      accounts: accountsData.data || [],
      transactions: transactionsData.data || [],
    });
  } catch (err) {
    console.error("❌ Basiq live mode failed:", err);

    // ✅ fallback to demo so frontend never crashes
    return res.status(200).json({
      mode: "demo",
      accounts: demoAccounts,
      transactions: demoTransactions,
      error: err.message,
    });
  }
}
