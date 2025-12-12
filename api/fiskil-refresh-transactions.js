import { createClient } from "@supabase/supabase-js";

const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com/v1").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

let cachedToken = null;
let cachedExpiry = 0;

function ensureConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase admin configuration missing on server");
  }
}

async function getToken() {
  ensureConfig();

  const now = Date.now();
  if (cachedToken && cachedExpiry > now + 5000) return cachedToken;

  const res = await fetch(`${FISKIL_API_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const bodyText = await res.text();

  if (!res.ok) {
    console.error("FISKIL_HTTP_ERROR", { url: `${FISKIL_API_URL}/oauth/token`, status: res.status, body: bodyText });
    throw new Error(`Fiskil token request failed (${res.status}): ${bodyText}`);
  }

  const json = JSON.parse(bodyText);
  cachedToken = json.access_token;
  cachedExpiry = now + (json.expires_in ? json.expires_in * 1000 : 50 * 60 * 1000);
  return cachedToken;
}

async function fiskilGet(path) {
  const token = await getToken();
  const url = `${FISKIL_API_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("FISKIL_HTTP_ERROR", { url, status: res.status, body: text });
    throw new Error(`Fiskil request failed (${res.status}): ${text}`);
  }

  return JSON.parse(text);
}

export default async function handler(req, res) {
  try {
    ensureConfig();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { userId } = req.body || {};
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Get accounts + transactions from Fiskil (paths may vary depending on your Fiskil product setup)
    // Keep your existing paths if they are already correct in your repo.
    const accounts = await fiskilGet(`/banking/v2/accounts?userId=${encodeURIComponent(userId)}`);

    // Pull transactions per account (if your API is different, keep your existing implementation)
    const allTransactions = [];
    for (const acct of accounts?.data || accounts || []) {
      const accountId = acct?.id;
      if (!accountId) continue;

      const tx = await fiskilGet(
        `/banking/v2/transactions?accountId=${encodeURIComponent(accountId)}`
      );

      const list = tx?.data || tx || [];
      for (const t of list) allTransactions.push(t);
    }

    // Upsert into Supabase (assumes you already have a `transactions` table and an upsert key)
    // Keep your existing schema mapping if your repo already does this differently.
    if (allTransactions.length) {
      const rows = allTransactions.map((t) => ({
        user_id: userId,
        transaction_id: t.id,
        raw: t,
        amount: t.amount ?? null,
        description: t.description ?? t.merchantName ?? null,
        occurred_at: t.date ?? t.postedAt ?? null,
      }));

      const { error: upsertErr } = await supabase
        .from("transactions")
        .upsert(rows, { onConflict: "transaction_id" });

      if (upsertErr) {
        console.error("SUPABASE_UPSERT_ERROR", upsertErr);
        return res.status(500).json({ error: "Failed to store transactions" });
      }
    }

    // Mark sync time on profile
    await supabase
      .from("profiles")
      .update({ last_transactions_sync_at: new Date().toISOString() })
      .eq("fiskil_user_id", userId);

    return res.status(200).json({ ok: true, transactions: allTransactions.length });
  } catch (err) {
    console.error("❌ /api/fiskil-refresh-transactions error:", err);
    return res.status(500).json({ error: "Server error", details: String(err?.message || err) });
  }
}