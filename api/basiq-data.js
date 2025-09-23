// api/basiq-data.js

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";
const DEMO_USER_ID = process.env.BASIQ_DEMO_USERID || null;

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
    // Accept userId from query, otherwise fallback to demo
    let { userId } = req.query;
    if (!userId) {
      if (!DEMO_USER_ID) {
        return res.status(400).json({
          error: "Basiq User ID is required.",
          details: "No userId provided and BASIQ_DEMO_USERID not configured.",
        });
      }
      userId = DEMO_USER_ID;
      console.log(`⚠️ Using demo userId: ${userId}`);
    }

    if (!BASIQ_API_KEY) {
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
      return res
        .status(500)
        .json({ error: "Failed to fetch accounts", details: errorText });
    }

    const accountsData = await accountsRes.json();

    // --- Step 3: Map accounts ---
    const accounts = accountsData.data.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: getAccountType(acc),
      balance: acc.balance,
      institution: acc.institution?.name || "Unknown",
    }));

    return res.status(200).json({ accounts });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error", details: err.message });
  }
}
