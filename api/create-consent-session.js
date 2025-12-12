// api/create-consent-session.js
// Node 18+ (Vercel) uses native fetch.

import { createClient } from "@supabase/supabase-js";

const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com/v1").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let cachedToken = null;
let cachedExpiry = 0;

function ensureConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin configuration missing on server");
  }
}

async function getToken() {
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

  const bodyText = await res.text();

  if (!res.ok) {
    console.error("FISKIL_HTTP_ERROR", { url: `${FISKIL_API_URL}/oauth/token`, status: res.status, body: bodyText });
    throw new Error(`Fiskil token request failed (${res.status}): ${bodyText}`);
  }

  const json = safeJsonParse(bodyText);
  const accessToken = json?.access_token;

  if (!accessToken) {
    throw new Error("Fiskil token response missing access_token");
  }

  cachedToken = accessToken;
  cachedExpiry = now + (json.expires_in ? json.expires_in * 1000 : 50 * 60 * 1000);
  return cachedToken;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function fiskilRequest(path, options = {}) {
  const accessToken = await getToken();

  const url = `${FISKIL_API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  const bodyText = await res.text();
  const json = safeJsonParse(bodyText);

  if (!res.ok) {
    console.error("FISKIL_HTTP_ERROR", { url, status: res.status, body: bodyText });
    throw new Error(`Fiskil request failed (${res.status}): ${bodyText}`);
  }

  return json ?? bodyText;
}

function extractUserId(payload) {
  if (!payload) return null;

  // Common shapes
  if (typeof payload === "object") {
    if (payload.id && typeof payload.id === "string") return payload.id;
    if (payload.userId && typeof payload.userId === "string") return payload.userId;
    if (payload.data?.id && typeof payload.data.id === "string") return payload.data.id;

    // Arrays
    if (Array.isArray(payload.data) && payload.data[0]?.id) return payload.data[0].id;
    if (Array.isArray(payload.users) && payload.users[0]?.id) return payload.users[0].id;
  }

  return null;
}

export default async function handler(req, res) {
  try {
    ensureConfig();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Require Supabase session token
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing auth" });
    }

    const jwt = auth.replace("Bearer ", "").trim();
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(jwt);

    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const appUserId = userRes.user.id;

    // Load profile mapping
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("fiskil_user_id")
      .eq("id", appUserId)
      .maybeSingle();

    if (profileErr) {
      console.error("SUPABASE_PROFILE_LOOKUP_ERROR", profileErr);
      return res.status(500).json({ error: "Profile lookup failed" });
    }

    let fiskilUserId = profile?.fiskil_user_id || null;

    // Create Fiskil user once (NO email lookup)
    if (!fiskilUserId) {
      const rawEmail = req.body?.email;
      const email =
        (typeof rawEmail === "string" && rawEmail.trim() ? rawEmail.toLowerCase().trim() : null) ||
        (userRes.user.email ? userRes.user.email.toLowerCase().trim() : null);

      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }

      const created = await fiskilRequest("/banking/v2/users", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      fiskilUserId = extractUserId(created);

      if (!fiskilUserId) {
        console.error("FISKIL_CREATE_USER_NO_ID", { created });
        return res.status(500).json({ error: "Could not create Fiskil user" });
      }

      // Persist mapping so we never need lookup-by-email
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ fiskil_user_id: fiskilUserId })
        .eq("id", appUserId);

      if (updateErr) {
        console.error("SUPABASE_PROFILE_UPDATE_ERROR", updateErr);
        // Not fatal for returning consent URL, but log it.
      }
    }

    // Create link token / consent URL
    const linkPayload = await fiskilRequest("/link/token", {
      method: "POST",
      body: JSON.stringify({
        userId: fiskilUserId,
        products: ["banking"],
      }),
    });

    const consentUrl =
      linkPayload?.url ||
      linkPayload?.linkTokenUrl ||
      linkPayload?.link_url ||
      linkPayload?.redirectUrl ||
      null;

    if (!consentUrl) {
      console.error("FISKIL_LINK_TOKEN_MISSING_URL", { linkPayload });
      return res.status(500).json({ error: "Could not obtain consent URL from Fiskil" });
    }

    return res.status(200).json({
      userId: fiskilUserId,
      consentUrl,
    });
  } catch (err) {
    console.error("❌ /api/create-consent-session error:", err);
    return res.status(500).json({
      error: "Unable to start bank connection",
      details: String(err?.message || err),
    });
  }
}