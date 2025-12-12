// api/create-consent-session.js
// Vercel Serverless Function (Node.js)
// Requires env vars:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - FISKIL_CLIENT_ID
// - FISKIL_CLIENT_SECRET

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

// Fiskil base
const FISKIL_BASE_URL = "https://api.fiskil.com/v1";

// Create an admin Supabase client for DB writes + auth lookups
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Simple in-memory Fiskil token cache (works within a warm lambda)
let cachedFiskilToken = null;
let cachedFiskilTokenExpiresAtMs = 0;

async function getFiskilAccessToken() {
  const now = Date.now();
  if (cachedFiskilToken && now < cachedFiskilTokenExpiresAtMs - 10_000) {
    return cachedFiskilToken;
  }

  const res = await fetch(`${FISKIL_BASE_URL}/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `FISKIL_TOKEN_ERROR: ${res.status} ${JSON.stringify(data)}`
    );
  }

  if (!data?.token) {
    throw new Error(`FISKIL_TOKEN_MISSING: ${JSON.stringify(data)}`);
  }

  cachedFiskilToken = data.token;
  const expiresInSec = Number(data.expires_in || 600);
  cachedFiskilTokenExpiresAtMs = Date.now() + expiresInSec * 1000;

  return cachedFiskilToken;
}

async function fiskilRequest(path, { method = "GET", token, body } = {}) {
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${FISKIL_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`FISKIL_API_ERROR ${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

// Extract Bearer token from Authorization header
function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken =
      getBearerToken(req) ||
      req.body?.access_token ||
      req.body?.accessToken ||
      null;

    if (!accessToken) {
      return res.status(401).json({
        error: "Missing Supabase access token",
        details:
          "Send Authorization: Bearer <session.access_token> when calling this endpoint.",
      });
    }

    // Validate token and get auth user (guarantees email is available)
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
      accessToken
    );

    if (userErr || !userData?.user) {
      return res.status(401).json({
        error: "Invalid Supabase session",
        details: userErr?.message || "Could not fetch user from token",
      });
    }

    const appUser = userData.user;
    const appUserId = appUser.id;
    const email = appUser.email;

    if (!email) {
      // With your NOT NULL constraint, we must stop here.
      return res.status(400).json({
        error: "Supabase user email missing",
        details:
          "Your profiles.email is NOT NULL. Ensure the auth user has an email.",
      });
    }

    const fullName =
      appUser.user_metadata?.full_name ||
      appUser.user_metadata?.name ||
      null;

    // Ensure profile exists (UPSERT so login users from a week ago are fixed)
    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: appUserId,
          email,
          full_name: fullName,
        },
        { onConflict: "id" }
      );

    if (upsertErr) {
      console.error("SUPABASE_PROFILE_UPSERT_ERROR", upsertErr);
      return res.status(500).json({
        error: "Profile create failed",
        details: upsertErr.message,
      });
    }

    // Load profile to get fiskil_user_id
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,fiskil_user_id")
      .eq("id", appUserId)
      .single();

    if (profileErr || !profile) {
      console.error("SUPABASE_PROFILE_LOOKUP_ERROR", profileErr);
      return res.status(500).json({
        error: "Profile lookup failed",
        details: profileErr?.message || "No profile returned",
      });
    }

    const fiskilToken = await getFiskilAccessToken();

    let fiskilUserId = profile.fiskil_user_id;

    // Create Fiskil End User if missing
    if (!fiskilUserId) {
      const created = await fiskilRequest("/end-users", {
        method: "POST",
        token: fiskilToken,
        body: {
          email: profile.email,
          name: profile.full_name || undefined,
        },
      });

      // Docs usually return { end_user_id: "..." }
      fiskilUserId = created.end_user_id || created.id;
      if (!fiskilUserId) {
        return res.status(500).json({
          error: "Fiskil end user create failed",
          details: `Unexpected response: ${JSON.stringify(created)}`,
        });
      }

      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ fiskil_user_id: fiskilUserId })
        .eq("id", appUserId);

      if (updateErr) {
        console.error("SUPABASE_PROFILE_UPDATE_ERROR", updateErr);
        return res.status(500).json({
          error: "Failed to persist Fiskil user ID",
          details: updateErr.message,
        });
      }
    }

    // Create Auth Session (this is where your earlier error complained about end_user_id missing)
    const session = await fiskilRequest("/auth/session", {
      method: "POST",
      token: fiskilToken,
      body: {
        end_user_id: fiskilUserId, // IMPORTANT: end_user_id (not end_user)
      },
    });

    // Try common URL fields; if none exist, return the whole session payload
    const consentUrl =
      session.consent_url ||
      session.redirect_url ||
      session.url ||
      session.link ||
      null;

    return res.status(200).json({
      userId: fiskilUserId,
      consentUrl,
      session,
    });
  } catch (err) {
    console.error("CREATE_CONSENT_SESSION_ERROR", err);
    return res.status(500).json({
      error: "Unable to start bank connection",
      details: err?.message || String(err),
    });
  }
};
