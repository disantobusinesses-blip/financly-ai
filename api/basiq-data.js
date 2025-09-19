import fetch from "node-fetch";

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

const getAccountType = (acc) => {
  if (acc.accountType === "savings") return "Savings";
  if (acc.accountType === "transaction") return "Checking";
  if (acc.accountType === "creditCard") return "Credit Card";
  if (
    acc.accountType === "loan" ||
    acc.accountType === "mortgage" ||
    acc.class === "loan"
  )
    return "Loan";
  if (acc.class === "credit-card") return "Credit Card";
  return "Checking";
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Basiq User ID is required." });
    }

    // Step 1: Get a server token
    const authorizationHeader = `Basic ${BASIQ_API_KEY}`;
    const tokenRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
    });
    if (!tokenRes.ok) throw new Error(await tokenRes.text());
    const { access_token: SERVER_TOKEN } = await tokenRes.json();

    // Step 2: Fetch accounts + transactions
    const accountsRes = await fetch(
      `${BASIQ_API_URL}/users/${userId}/accounts`,
      {
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "basiq-version": "3.0",
        },
      }
    );
    if (!accountsRes.ok) throw new Error(await accountsRes.text());
    const { data: basiqAccounts } = await accountsRes.json();

    const transactionsRes = await fetch(
      `${BASIQ_API_URL}/users/${userId}/transactions`,
      {
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "basiq-version": "3.0",
        },
      }
    );
    if (!transactionsRes.ok) throw new Error(await transactionsRes.text());
    const { data: basiqTransactions } = await transactionsRes.json();

    // Step 3: If no data, trigger refresh job
    if (
      (!basiqAccounts || basiqAccounts.length === 0) &&
      (!basiqTransactions || basiqTransactions.length === 0)
    ) {
      const jobRes = await fetch(`${BASIQ_API_URL}/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "Content-Ty
