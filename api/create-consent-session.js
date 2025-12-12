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
      Authorization: `Basic ${Buffer.from(
        `${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`
      ).toString("base64")}`,
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

  const url = `${FISKIL_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const bodyText = await res.text();
  let body;
  try {
    body = contentType.includes("application/json") ? JSON.parse(bodyText) : bodyText;
  } catch {
    body = bodyText;
  }

  if (!res.ok) {
    console.error({ url, status: res.status, body });
    throw new Error(`Fiskil request failed (${res.status})`);
  }

  return body;
}

// Try to pull a user id out of various possible response shapes
function extractUserId(payload) {
  if (!payload) return null;

  // Direct object: { id: "..." }
  if (typeof payload === "object" && payload.id && typeof payload.id === "string") {
    return payload.id;
  }

  // { user: { id: "..." } }
  if (payload.user && typeof payload.user.id === "string") {
    return payload.user.id;
  }

  // { data: { id: "..." } }
  if (payload.data && typeof payload.data.id === "string") {
    return payload.data.id;
  }

  // { data: [ { id: "..." }, ... ] }
  if (payload.data && Array.isArray(payload.data) && payload.data[0] && typeof payload.data[0].id === "string") {
    return payload.data[0].id;
  }

  // { users: [ { id: "..." }, ... ] }
  if (payload.users && Array.isArray(payload.users) && payload.users[0] && typeof payload.users[0].id === "string") {
    return payload.users[0].id;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    return res.status(500).json({ error: "Fiskil configuration missing on server" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Supabase configuration missing on server" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const jwt = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(jwt);

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("fiskil_user_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return res.status(500).json({ error: "Unable to load profile" });
  }

  const rawEmail = req.body?.email || user.email;
  const email =
    typeof rawEmail === "string" && rawEmail.trim()
      ? rawEmail.toLowerCase().trim()
      : `user-${Date.now()}@example.com`;

  try {
    let userId = profile?.fiskil_user_id;

    if (!userId) {
      const userPayload = await fiskilRequest("/banking/v2/users", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      userId = extractUserId(userPayload);

      if (!userId) {
        console.error("❌ Fiskil user payload had no id:", JSON.stringify(userPayload));
        return res.status(500).json({
          error: "Could not create Fiskil user",
          raw: userPayload || null,
        });
      }

      await supabaseAdmin
        .from("profiles")
        .update({ fiskil_user_id: userId })
        .eq("id", user.id);
    }

    // Now create link token / consent URL
    const linkPayload = await fiskilRequest("/link/token", {
      method: "POST",
      body: JSON.stringify({
        userId,
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
      console.error("❌ Fiskil link token response missing URL:", JSON.stringify(linkPayload));
      return res.status(500).json({
        error: "Could not obtain consent URL from Fiskil",
        raw: linkPayload || null,
      });
    }

    return res.status(200).json({
      userId,
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
