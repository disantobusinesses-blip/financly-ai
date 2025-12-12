// api/fiskil-refresh-transactions.js
import { createClient } from "@supabase/supabase-js";

const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cachedToken = null;
let cachedExpiry = 0;

function ensureConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase configuration missing on server");
  }
}

async function getAccessToken() {
  ensureConfig();

  const now = Date.now();
  if (cachedToken && cachedExpiry > now + 5000) return cachedToken;

  const res = await fetch(`${FISKIL_API_URL}/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.access_token) {
    throw new Error(
      `Fiskil token error (${res.status}): ${json ? JSON.stringify(json) : "no json"}`
    );
  }

  cachedToken = json.access_token;
  cachedExpiry = now + Number(json.expires_in || 0) * 1000;
  return cachedToken;
}

async function fiskilGet(path) {
  const token = await getAccessToken();
  const url = `${FISKIL_API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  const text = await r.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // keep as text
  }

  if (!r.ok) {
    console.error("Fiskil GET error", { url, status: r.status, body });
    throw new Error(
      `Fiskil request failed (${r.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`
    );
  }

  return body;
}

function normalizeTransactions(txResp) {
  if (!txResp) return [];
  if (Array.isArray(txResp.data)) return txResp.data;
  if (Array.isArray(txResp.transactions)) return txResp.transactions;
  return [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    ensureConfig();
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing auth" });

  const jwt = auth.replace("Bearer ", "").trim();

  // Use anon client to validate JWT
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authErr } = await supabaseAuth.auth.getUser(jwt);
  if (authErr || !authData?.user) return res.status(401).json({ error: "Invalid session" });

  const appUserId = authData.user.id;

  // Use service role for DB reads/writes
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("fiskil_user_id,last_transactions_sync_at")
    .eq("id", appUserId)
    .maybeSingle();

  if (profileErr) return res.status(500).json({ error: profileErr.message });
  if (!profile?.fiskil_user_id) return res.status(400).json({ error: "No connected bank" });

  const from = profile.last_transactions_sync_at
    ? `?from=${encodeURIComponent(profile.last_transactions_sync_at)}`
    : "";

  try {
    const txResp = await fiskilGet(
      `/banking/v2/users/${encodeURIComponent(profile.fiskil_user_id)}/transactions${from}`
    );

    const transactions = normalizeTransactions(txResp);

    if (transactions.length) {
      const formatted = transactions.map((t) => ({
        id: t.id,
        user_id: appUserId,
        account_id: t.account?.id || t.accountId || t.account_id || "unknown",
        description: t.description || t.narration || "Transaction",
        amount: typeof t.amount === "number" ? t.amount : Number(t.amount) || 0,
        date: t.date || t.postDate || t.transactionDate || new Date().toISOString(),
        category: t.category?.text || t.category || "Other",
      }));

      const { error: upsertErr } = await supabaseAdmin
        .from("transactions")
        .upsert(formatted, { onConflict: "id" });

      if (upsertErr) return res.status(500).json({ error: upsertErr.message });
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        last_transactions_sync_at: new Date().toISOString(),
        has_bank_connection: true,
      })
      .eq("id", appUserId);

    return res.status(200).json({ success: true, count: transactions.length });
  } catch (err) {
    console.error("❌ /api/fiskil-refresh-transactions error:", err);
    return res.status(500).json({ error: err?.message || "Unable to refresh transactions" });
  }
}