// api/basiq-data.js

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

// --- Helper: Map account type ---
const getAccountType = (acc) => {
  if (acc.accountType === "savings") return "Savings";
  if (acc.accountType === "transaction") return "Checking";
  if (acc.accountType === "creditCard") return "Credit Card";
  if (acc.accountType === "loan" || acc.accountType === "mortgage" || acc.class === "loan")
    return "Loan";
  if (acc.class === "credit-card") return "Credit Card";
  return "Checking";
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { userId } = req.query;
    if (!userId) {
      console.error("❌ Missing userId in request query");
      return res.status(400).json({ error: "Basiq User ID is required." });
    }

    if (!BASIQ_API_KEY) {
      console.error("❌ Missing BASIQ_API_KEY environment variable");
      return res.status(500).json({ error: "Server misconfigured: BASIQ_API_KEY missing." });
    }

    // --- Step 1: Get server token ---
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
      console.error("❌ Failed to get BASIQ token:", errorText);
      return res.status(500).json({ error: "Failed to get BASIQ token", details: errorText });
    }

    const { access_token: SERVER_TOKEN } = await tokenRes.json();

    // --- Step 2: Fetch accounts ---
    const accountsRes = await fetch(`${BASIQ_API_URL}/users/${userId}/accounts`, {
      headers: {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "basiq-version": "3.0",
      },
    });

    if (!accountsRes.ok) {
      const errorText = await accountsRes.text();
      console.error("❌ Failed to fetch accounts for user:", userId);
      console.error("Status:", accountsRes.status, "Response:", errorText);
      return res.status(500).json({ error: "Failed to fetch accounts", details: errorText });
    }

    const { data: basiqAccounts } = await accountsRes.json();

    // --- Step 3: Fetch transactions ---
    const transactionsRes = await fetch(`${BASIQ_API_URL}/users/${userId}/transactions`, {
      headers: {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "basiq-version": "3.0",
      },
    });

    if (!transactionsRes.ok) {
      const errorText = await transactionsRes.text();
      console.error("❌ Failed to fetch transactions for user:", userId);
      console.error("Status:", transactionsRes.status, "Response:", errorText);
      return res.status(500).json({ error: "Failed to fetch transactions", details: errorText });
    }

    const { data: basiqTransactions } = await transactionsRes.json();

    // --- Step 4: Trigger refresh job if no data ---
    if ((!basiqAccounts || basiqAccounts.length === 0) &&
        (!basiqTransactions || basiqTransactions.length === 0)) {
      console.warn("⚠️ No accounts/transactions found, starting refresh job...");

      const jobRes = await fetch(`${BASIQ_API_URL}/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "Content-Type": "application/json",
          "basiq-version": "3.0",
        },
        body: JSON.stringify({
          steps: [{ type: "refresh-user", userId }],
        }),
      });

      if (!jobRes.ok) {
        const jobError = await jobRes.text();
        console.error("❌ Failed to trigger refresh job:", jobError);
        return res.status(500).json({ error: "Failed to trigger refresh job", details: jobError });
      }

      const jobData = await jobRes.json();
      console.log("✅ Refresh job started:", jobData.id);

      return res.status(202).json({
        message: "No data yet, refresh job started.",
        jobId: jobData.id,
      });
    }

    // --- Step 5: Return clean accounts & transactions ---
    const accounts = basiqAccounts.map((acc) => ({
      id: acc.id,
      name: acc.accountName,
      type: getAccountType(acc),
      balance: acc.balance,
      currency: acc.currency,
    }));

    const transactions = basiqTransactions.map((txn) => ({
      id: txn.id,
      accountId: txn.account.id,
      description: txn.description,
      amount: txn.amount,
      date: txn.postDate,
      category: txn.subClass?.title || txn.class?.title || "Uncategorized",
    }));

    console.log(`✅ Returning ${accounts.length} accounts and ${transactions.length} transactions`);
    res.status(200).json({ accounts, transactions });

  } catch (err) {
    console.error("❌ BASIQ API error (uncaught):", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
