import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Configure Fiskil webhooks in the Fiskil Console:
 * Settings → Teams → Webhooks, pointing to:
 *   https://www.financlyai.com/api/fiskil-webhook
 *
 * Set env:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - (optional but recommended) FISKIL_WEBHOOK_SECRET
 *
 * Fiskil docs mention signing webhook payloads with HMAC-SHA256. :contentReference[oaicite:1]{index=1}
 * Header naming can vary; this handler checks common candidates.
 */

export const config = {
  api: {
    bodyParser: false, // we need raw body for HMAC verification
  },
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FISKIL_WEBHOOK_SECRET = process.env.FISKIL_WEBHOOK_SECRET || "";

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

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function getSignatureHeader(req) {
  // Try common signature headers (naming differs between providers)
  return (
    req.headers["x-fiskil-signature"] ||
    req.headers["fiskil-signature"] ||
    req.headers["x-webhook-signature"] ||
    req.headers["x-signature"] ||
    req.headers["signature"] ||
    ""
  );
}

function timingSafeEquals(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function computeHmacSha256Hex(secret, payloadBuf) {
  return crypto.createHmac("sha256", secret).update(payloadBuf).digest("hex");
}

function extractEndUserId(payload) {
  return (
    payload?.end_user_id ||
    payload?.endUserId ||
    payload?.data?.end_user_id ||
    payload?.data?.endUserId ||
    payload?.resource?.end_user_id ||
    payload?.resource?.endUserId ||
    null
  );
}

function extractEventType(payload) {
  return payload?.type || payload?.event || payload?.name || payload?.event_type || payload?.eventType || null;
}

function isSyncCompleteEvent(type) {
  // Fiskil docs reference: banking.transactions.basic.sync.completed :contentReference[oaicite:2]{index=2}
  const t = String(type || "").toLowerCase();
  return (
    t === "banking.transactions.basic.sync.completed" ||
    t === "banking.transactions.sync.completed" ||
    t === "banking.accounts.sync.completed" ||
    t.endsWith(".sync.completed")
  );
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const raw = await readRawBody(req);

    // Verify signature if secret set
    if (FISKIL_WEBHOOK_SECRET) {
      const providedSig = String(getSignatureHeader(req)).trim();
      if (!providedSig) {
        return res.status(401).json({ error: "Missing webhook signature header" });
      }

      // We don’t know if Fiskil sends hex vs prefixed format; support both:
      const computedHex = computeHmacSha256Hex(FISKIL_WEBHOOK_SECRET, raw);

      // Accept: exact hex, or "sha256=<hex>"
      const normalizedProvided = providedSig.toLowerCase().startsWith("sha256=")
        ? providedSig.slice("sha256=".length).trim()
        : providedSig;

      if (!timingSafeEquals(normalizedProvided, computedHex)) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
    }

    let payload = null;
    try {
      payload = JSON.parse(raw.toString("utf-8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const endUserId = extractEndUserId(payload);
    const eventType = extractEventType(payload);

    if (!endUserId) {
      return res.status(400).json({ error: "Missing end_user_id in webhook payload" });
    }

    const nowIso = new Date().toISOString();
    const update = {
      fiskil_last_webhook_event: eventType || "unknown",
      fiskil_last_webhook_at: nowIso,
      updated_at: nowIso,
    };

    if (isSyncCompleteEvent(eventType)) {
      update.fiskil_sync_completed_at = nowIso;
    }

    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("fiskil_user_id", endUserId);

    if (updErr) {
      console.error("Webhook profile update failed:", updErr);
      return res.status(500).json({ error: "Failed to update profile", details: updErr.message });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return res.status(500).json({ error: "Webhook handler error", details: String(e?.message || e) });
  }
}
