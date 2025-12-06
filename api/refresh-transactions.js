import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://wyommhasmvdhqxwehhel.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

let cachedToken = null;
let cachedExpiry = 0;

function ensureFiskilConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
}

async function getFiskilAccessToken() {
  ensureFiskilConfig();
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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fiskil token request failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  cachedToken = json.access_token;
  cachedExpiry = now + (json.expires_in ? json.expires_in * 1000 : 0);
  return cachedToken;
}

async function fiskilRequest(path, options = {}) {
  const token = await getFiskilAccessToken();
  const res = await fetch(`${FISKIL_API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    return res.status(500).json({ error: "Fiskil configuration missing on server" });
  }

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

    const params = new URLSearchParams();
    const since = profile.last_transactions_sync_at;
    if (since) params.set("from", since);
    const suffix = params.size ? `?${params.toString()}` : "";

    const txRes = await fiskilRequest(
      `/banking/v2/users/${encodeURIComponent(profile.basiq_user_id)}/transactions${suffix}`,
      { method: "GET" }
    );

    const transactions = Array.isArray(txRes?.data) ? txRes.data : txRes?.transactions || [];

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
