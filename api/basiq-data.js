// api/basiq-data.js
import { demoAccounts, demoTransactions } from "./demoData.js";

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId } = req.query;

  // ✅ DEMO fallback
  if (!userId || typeof userId !== "string" || !userId.startsWith("u-")) {
    return res.status(200).json({
      mode: "demo",
      accounts: demoAccounts,
      transactions: demoTransactions,
    });
  }

  try {
    if (!BASIQ_API_KEY) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: BASIQ_API_KEY missing." });
    }

    // STEP 1️⃣ — Get server token
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
      return res
        .status(500)
        .json({ error: "Failed to get BASIQ token", details: errorText });
    }

    const { access_token: SERVER_TOKEN } = await tokenRes.json();

    // STEP 2️⃣ — Fetch accounts
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

    const accountsRaw = await accountsRes.json();

    // ✅ Normalize accounts safely
    const accounts = (accountsRaw.data || []).map((a) => ({
      id: a.id,
      name: a.accountName || a.name || "Unknown Account",
      type: a.accountType || a.type || "Unknown",
      balance: Number(
        typeof a.balance === "object" ? a.balance?.value ?? 0 : a.balance ?? 0
      ),
      currency: a.balance?.currency || "AUD",
      institution: a.institution?.name || "Unknown Bank",
    }));

    // STEP 3️⃣ — Fetch transactions
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

    const txRaw = await txRes.json();

    // ✅ Normalize transactions to your app’s structure
    const transactions = (txRaw.data || []).map((t) => ({
      id: t.id,
      accountId: t.account?.id || "unknown",
      description: t.description || "Unknown Transaction",
      amount: Number(
        typeof t.amount === "object"
          ? t.amount?.value ?? 0
          : t.amount ?? 0
      ),
      date: t.postDate?.split("T")[0] || "Unknown",
      category:
        t.class?.category ||
        t.class?.type ||
        t.subClass?.title ||
        "Uncategorized",
    }));

    return res.status(200).json({
      mode: "live",
      accounts,
      transactions,
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
}
