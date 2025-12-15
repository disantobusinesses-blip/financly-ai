import { createClient } from "@supabase/supabase-js";

/**
 * IMPORTANT
 * - This file is ESM (no require).
 * - Uses process.env only (server).
 * - Builds redirect_url reliably.
 * - Logs enough to see why it fails in Vercel.
 */

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const getAuthBearer = (req) => {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return json(res, 405, { error: "Method not allowed" });
    }

    // ---- ENV (server) ----
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
    const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

    // You can set this; if not, we fall back to req headers.
    const FRONTEND_URL = process.env.FRONTEND_URL;

    // Fiskil base URL (set it if you have one; otherwise default placeholder)
    // Example could be: https://api.fiskil.com (use your actual Fiskil base)
    const FISKIL_BASE_URL = process.env.FISKIL_BASE_URL || "";

    const missing = [];
    if (!SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!FISKIL_CLIENT_ID) missing.push("FISKIL_CLIENT_ID");
    if (!FISKIL_CLIENT_SECRET) missing.push("FISKIL_CLIENT_SECRET");
    if (!FISKIL_BASE_URL) missing.push("FISKIL_BASE_URL");

    if (missing.length) {
      console.error("❌ Missing env vars:", missing);
      return json(res, 500, {
        error: "Server misconfigured",
        missing,
      });
    }

    // ---- AUTH: get Supabase user from Bearer token ----
    const accessToken = getAuthBearer(req);
    if (!accessToken) {
      return json(res, 401, { error: "Missing Authorization Bearer token" });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      console.error("❌ Supabase getUser failed:", userErr?.message || userErr);
      return json(res, 401, { error: "Invalid session" });
    }

    const user = userData.user;

    // ---- Build redirect_url (must be absolute) ----
    const originFromHeaders =
      (req.headers["x-forwarded-proto"] && req.headers["x-forwarded-host"])
        ? `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"]}`
        : req.headers.origin;

    const baseUrl = (FRONTEND_URL || originFromHeaders || "").replace(/\/$/, "");

    if (!baseUrl) {
      console.error("❌ Cannot determine baseUrl for redirect_url");
      return json(res, 500, { error: "Missing FRONTEND_URL and no request origin/forwarded headers" });
    }

    // Use your real callback route here
    const redirect_url = `${baseUrl}/onboarding`;

    // ---- (Optional) Upsert profile - now safe with service_role + your RLS policies ----
    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          // Keep existing full_name if present; don’t overwrite with null
          full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
          onboarding_step: "CONNECT_BANK",
          is_onboarded: false,
        },
        { onConflict: "id" }
      );

    if (upsertErr) {
      console.error("❌ Profile upsert failed:", upsertErr.message);
      return json(res, 500, { error: `Profile upsert failed: ${upsertErr.message}` });
    }

    // ---- Call Fiskil ----
    // NOTE: Endpoint path MUST match Fiskil docs.
    // Replace CONSENT_SESSION_PATH with the correct path from Fiskil.
    const CONSENT_SESSION_PATH = process.env.FISKIL_CONSENT_SESSION_PATH || "/consents/sessions";

    const url = `${FISKIL_BASE_URL.replace(/\/$/, "")}${CONSENT_SESSION_PATH}`;

    // Replace payload fields to match Fiskil docs.
    // The key fix: redirect_url is ALWAYS present.
    const payload = {
      redirect_url,
      // Example identifiers; adjust to doc requirements
      reference: user.id,
    };

    console.log("➡️ Fiskil request:", {
      url,
      hasClientId: Boolean(FISKIL_CLIENT_ID),
      redirect_url,
      payloadKeys: Object.keys(payload),
    });

    const fiskilRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Adjust auth header to Fiskil’s requirements (Basic/Bearer/etc)
        // This is a placeholder: many APIs use Basic base64(client_id:client_secret)
        Authorization:
          "Basic " + Buffer.from(`${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`).toString("base64"),
      },
      body: JSON.stringify(payload),
    });

    const text = await fiskilRes.text();
    let fiskilJson = null;
    try {
      fiskilJson = text ? JSON.parse(text) : null;
    } catch {
      // leave as null
    }

    if (!fiskilRes.ok) {
      console.error("❌ Fiskil error:", {
        status: fiskilRes.status,
        body: fiskilJson || text,
      });
      return json(res, 500, {
        error: "Fiskil request failed",
        status: fiskilRes.status,
        body: fiskilJson || text,
      });
    }

    // Return whatever your frontend expects (url, session_id, etc.)
    return json(res, 200, {
      redirect_url,
      fiskil: fiskilJson || text,
    });
  } catch (err) {
    console.error("❌ /api/create-consent-session fatal:", err);
    return json(res, 500, { error: err?.message || "Internal Server Error" });
  }
}
