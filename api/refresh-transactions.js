import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://wyommhasmvdhqxwehhel.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let CACHED_SERVER_TOKEN = null;
let SERVER_TOKEN_EXPIRY = 0;

function normalizedBasicKey() {
  if (!BASIQ_API_KEY) throw new Error("Missing BASIQ_API_KEY env var");
  const raw = BASIQ_API_KEY.trim();
  return raw.startsWith("Basic ") ? raw : `Basic ${raw}`;
}

async function getServerToken() {
  const now = Date.now();
  if (CACHED_SERVER_TOKEN && now < SERVER_TOKEN_EXPIRY) return CACHED_SERVER_TOKEN;

  const res = await fetch(`${BASIQ_API_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: normalizedBasicKey(),
      "Content-Type": "application/x-www-form-urlencoded",
      "basiq-version": "3.0",
    },
    body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to get server token: ${t}`);
  }
  const { access_token } = await res.json();
  CACHED_SERVER_TOKEN = access_token;
  SERVER_TOKEN_EXPIRY = now + 55 * 60 * 1000;
  return CACHED_SERVER_TOKEN;
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userResponse.ok) return res.status(401).json({ error: "Invalid token" });
    const userData = await userResponse.json();
    const userId = userData?.user?.id;
    if (!userId) return res.status(400).json({ error: "User not found" });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("basiq_user_id,last_transactions_sync_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) return res.status(500).json({ error: profileError.message });
    if (!profile?.basiq_user_id) return res.status(400).json({ error: "No connected bank" });

    const SERVER_TOKEN = await getServerToken();
    const params = new URLSearchParams();
    const since = profile.last_transactions_sync_at;
    if (since) params.set("from", since);

    const txRes = await fetch(
      `${BASIQ_API_URL}/users/${encodeURIComponent(profile.basiq_user_id)}/transactions${params.size ? `?${params.toString()}` : ""}`,
      { headers: { Authorization: `Bearer ${SERVER_TOKEN}`, "basiq-version": "3.0" } }
    );

    if (!txRes.ok) {
      const txt = await txRes.text();
      throw new Error(`Unable to fetch transactions: ${txt}`);
    }

    const txJson = await txRes.json();
    const transactions = Array.isArray(txJson?.data) ? txJson.data : [];

    if (transactions.length > 0) {
      const formatted = transactions.map((tx) => ({
        id: tx.id,
        user_id: userId,
        account_id: tx.account?.id || tx.accountId || "unknown",
        description: tx.description || tx.narration || "Transaction",
        amount: typeof tx.amount === "number" ? tx.amount : Number(tx.amount) || 0,
        date: tx.date || tx.postDate || tx.transactionDate || new Date().toISOString(),
        category: tx.category?.text || tx.category || "Other",
      }));

      const { error: upsertError } = await supabaseAdmin.from("transactions").upsert(formatted, { onConflict: "id" });
      if (upsertError) throw new Error(upsertError.message);
    }

    await supabaseAdmin
      .from("profiles")
      .update({ last_transactions_sync_at: new Date().toISOString(), has_bank_connection: true })
      .eq("id", userId);

    return res.status(200).json({ success: true, count: transactions.length });
  } catch (err) {
    console.error("❌ /api/refresh-transactions error:", err);
    return res.status(500).json({ error: err?.message || "Unable to refresh transactions" });
  }
}
