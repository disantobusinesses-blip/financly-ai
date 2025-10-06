// api/basiq-data.js
import { demoAccounts, demoTransactions } from "./demoData.js";

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(200).json({
      mode: "demo",
      accounts: demoAccounts,
      transactions: demoTransactions,
    });
  }

  try {
    // 1️⃣ Get server token
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
      throw new Error(`Failed to get BASIQ token: ${errorText}`);
    }

    const { access_token: SERVER_TOKEN } = await tokenRes.json();

    // 2️⃣ Fetch accounts
    const accountsRes = await fetch(`${BASIQ_API_URL}/users/${userId}/accounts`, {
      headers: {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "basiq-version": "3.0",
      },
    });

    const accountsRaw = await accountsRes.json();
    const accounts = (accountsRaw.data || []).map((a) => ({
      id: a.id,
      name: a.name || a.institution?.name || "Account",
      type: a.type?.toUpperCase() || "OTHER",
      balance: a.balance?.available ?? a.balance?.current ?? 0,
      currency: a.currency || "AUD",
    }));

    // 3️⃣ Fetch transactions
    const txRes = await fetch(`${BASIQ_API_URL}/users/${userId}/transactions`, {
      headers: {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "basiq-version": "3.0",
      },
    });

    const txRaw = await txRes.json();
    const transactions = (txRaw.data || []).map((t) => ({
      id: t.id,
      accountId: t.account?.id || "unknown",
      description: t.description || "Unknown Transaction",
      amount: Number(t.amount?.value ?? 0),
      date: t.postDate?.split("T")[0] || "Unknown",
      category:
        t.class?.category ||
        t.class?.type ||
        "Uncategorized",
    }));

    // 4️⃣ Send normalized response
    res.status(200).json({
      mode: "live",
      accounts,
      transactions,
    });
  } catch (err) {
    console.error("❌ BASIQ fetch error:", err);
    res.status(500).json({
      error: "Failed to load Basiq data",
      details: err.message,
    });
  }
}
