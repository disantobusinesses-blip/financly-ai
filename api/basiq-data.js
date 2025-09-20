import fetch from "node-fetch";

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

const getAccountType = (acc: any) => {
  if (acc.accountType === "savings") return "Savings";
  if (acc.accountType === "transaction") return "Checking";
  if (acc.accountType === "creditCard") return "Credit Card";
  if (acc.accountType === "loan" || acc.accountType === "mortgage" || acc.class === "loan") return "Loan";
  if (acc.class === "credit-card") return "Credit Card";
  return "Checking";
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Basiq User ID is required." });
    }

    // --- Step 1: Get a server token ---
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
      const msg = await tokenRes.text();
      throw new Error("Failed to fetch BASIQ server token: " + msg);
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
      const msg = await accountsRes.text();
      throw new Error("Failed to fetch BASIQ accounts: " + msg);
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
      const msg = await transactionsRes.text();
      throw new Error("Failed to fetch BASIQ transactions: " + msg);
    }

    const { data: basiqTransactions } = await transactionsRes.json();

    // --- Step 4: Return mapped data ---
    const accounts = basiqAccounts.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      type: getAccountType(acc),
      balance: acc.balance,
      currency: acc.currency,
    }));

    const transactions = basiqTransactions.map((txn: any) => ({
      id: txn.id,
      accountId: txn.account.id,
      description: txn.description,
      amount: txn.amount,
      date: txn.postDate,
      category: txn.subclass?.toString() || "Other",
    }));

    return res.status(200).json({ accounts, transactions });
  } catch (err: any) {
    console.error("❌ BASIQ API error:", err.message || err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
