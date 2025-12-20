import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function mustEnv(name, value) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const supabaseAdmin = (() => {
  mustEnv("SUPABASE_URL", SUPABASE_URL);
  mustEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
})();

function getBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h) return null;
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

export default async function handler(req, res) {
  try {
    const jwt = getBearerToken(req);
    if (!jwt) return res.status(401).json({ error: "Missing auth" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const appUserId = userData.user.id;

    // confirm bank connection exists
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("has_bank_connection,fiskil_user_id,last_transactions_sync_at")
      .eq("id", appUserId)
      .maybeSingle();

    if (profErr) return res.status(500).json({ error: profErr.message });

    if (!profile?.fiskil_user_id) {
      return res.status(400).json({ error: "No connected bank" });
    }

    // load accounts from DB
    const { data: accounts, error: accErr } = await supabaseAdmin
      .from("accounts")
      .select("*")
      .eq("user_id", appUserId);

    if (accErr) return res.status(500).json({ error: accErr.message });

    // load transactions from DB (latest first)
    const { data: transactions, error: txErr } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", appUserId)
      .order("date", { ascending: false })
      .limit(2000);

    if (txErr) return res.status(500).json({ error: txErr.message });

    return res.status(200).json({
      accounts: accounts || [],
      transactions: transactions || [],
      last_updated: profile?.last_transactions_sync_at || null,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Fiskil data error",
      details: String(error?.message || error),
    });
  }
}
