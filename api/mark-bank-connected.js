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
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = userData.user.id;

    const endUserId =
      req.body?.end_user_id ||
      req.body?.endUserId ||
      req.body?.userId ||
      null;

    if (!endUserId || typeof endUserId !== "string") {
      return res.status(400).json({ error: "Missing end_user_id" });
    }

    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        has_bank_connection: true,
        fiskil_user_id: endUserId,
        onboarding_step: "COMPLETE",
        is_onboarded: true,
        updated_at: nowIso,
      })
      .eq("id", userId);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ /api/mark-bank-connected error:", err);
    return res.status(500).json({ error: "Unable to mark bank connection" });
  }
}
