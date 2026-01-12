import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FISKIL_WEBHOOK_SECRET = process.env.FISKIL_WEBHOOK_SECRET || null;

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

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function verifySignature(rawBody, signatureHeader) {
  if (!FISKIL_WEBHOOK_SECRET) return { ok: true, reason: "no_secret_configured" };
  if (!signatureHeader) return { ok: false, reason: "missing_signature_header" };

  let sig = String(signatureHeader).trim();
  // allow "sha256=..."
  if (sig.toLowerCase().startsWith("sha256=")) sig = sig.slice(7);

  const expected = crypto.createHmac("sha256", FISKIL_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  return { ok, reason: ok ? "verified" : "mismatch" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method Not Allowed" });

  try {
    const raw = await readRawBody(req);
    const sigHeader = req.headers["x-fiskil-signature"] || req.headers["x-fiskil-signature".toLowerCase()];
    const verify = verifySignature(raw, sigHeader);

    if (!verify.ok) {
      return sendJson(res, 401, { error: "Invalid webhook signature", details: verify.reason });
    }

    let payload = null;
    try {
      payload = JSON.parse(raw.toString("utf-8"));
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON" });
    }

    // Best-effort: different Fiskil events may nest these differently
    const endUserId =
      payload?.end_user_id ||
      payload?.endUserId ||
      payload?.data?.end_user_id ||
      payload?.data?.endUserId ||
      null;

    const eventType =
      payload?.event ||
      payload?.event_type ||
      payload?.type ||
      payload?.data?.event ||
      payload?.data?.type ||
      "unknown";

    if (!endUserId) {
      // still 200 so Fiskil doesn’t retry forever
      console.warn("fiskil-webhook: missing end_user_id", payload);
      return sendJson(res, 200, { ok: true, ignored: true, reason: "missing_end_user_id" });
    }

    // Find the app user by fiskil_user_id
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id,fiskil_user_id")
      .eq("fiskil_user_id", endUserId)
      .maybeSingle();

    if (profErr) throw new Error(profErr.message);
    if (!profile?.id) {
      console.warn("fiskil-webhook: no matching profile for end_user_id", endUserId);
      return sendJson(res, 200, { ok: true, ignored: true, reason: "no_matching_profile" });
    }

    // Mark sync time (this is the key signal your UI is waiting on)
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({
        last_transactions_sync_at: nowIso,
        has_bank_connection: true,
        updated_at: nowIso,
      })
      .eq("id", profile.id);

    if (updErr) throw new Error(updErr.message);

    return sendJson(res, 200, { ok: true, end_user_id: endUserId, event: eventType, verified: verify.reason });
  } catch (err) {
    console.error("fiskil-webhook error:", err);
    // 200 to avoid webhook retry storms while you’re iterating; logs will show the error
    return sendJson(res, 200, { ok: false, error: "webhook handler error", details: String(err?.message || err) });
  }
}
