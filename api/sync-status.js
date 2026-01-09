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
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const jwt = getBearerToken(req);
    if (!jwt) return res.status(401).json({ error: "Missing auth" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) return res.status(401).json({ error: "Invalid session" });

    const appUserId = userData.user.id;

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("fiskil_user_id,has_bank_connection,last_transactions_sync_at,updated_at")
      .eq("id", appUserId)
      .maybeSingle();

    if (profErr) return res.status(500).json({ error: profErr.message });

    const { count: accountsCount, error: accErr } = await supabaseAdmin
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", appUserId);

    if (accErr) return res.status(500).json({ error: accErr.message });

    const { count: transactionsCount, error: txErr } = await supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", appUserId);

    if (txErr) return res.status(500).json({ error: txErr.message });

    return res.status(200).json({
      user_id: appUserId,
      fiskil_user_id: profile?.fiskil_user_id || null,
      has_bank_connection: Boolean(profile?.has_bank_connection),
      last_transactions_sync_at: profile?.last_transactions_sync_at || null,
      profile_updated_at: profile?.updated_at || null,
      accounts_count: accountsCount || 0,
      transactions_count: transactionsCount || 0,
    });
  } catch (e) {
    return res.status(500).json({ error: "sync-status failed", details: String(e?.message || e) });
  }
}
