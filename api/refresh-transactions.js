import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import { fetchUserTransactions } from "../src/lib/fiskilClient";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wyommhasmvdhqxwehhel.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      .select("fiskil_customer_id,last_transactions_sync_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) return res.status(500).json({ error: profileError.message });
    if (!profile?.fiskil_customer_id) return res.status(400).json({ error: "No connected bank" });

    const paramsFrom = profile.last_transactions_sync_at;
    const transactions = await fetchUserTransactions(profile.fiskil_customer_id, paramsFrom || undefined);

    if (transactions.length > 0) {
      const formatted = transactions.map((tx) => ({
        id: tx.id,
        user_id: userId,
        account_id: tx.account?.id || tx.accountId || tx.account_id || "unknown",
        description: tx.description || tx.narration || tx.merchant?.name || "Transaction",
        amount: typeof tx.amount === "number" ? tx.amount : Number(tx.amount) || 0,
        date: tx.posted_at || tx.date || tx.postDate || tx.transactionDate || new Date().toISOString(),
        category: tx.category?.name || tx.category?.text || tx.category || "Other",
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
