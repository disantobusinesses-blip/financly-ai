// api/create-consent-session.js
// Vercel Node 18+ uses native fetch.
import { createClient } from "@supabase/supabase-js";

// IMPORTANT:
// - Set FISKIL_API_URL to "https://api.fiskil.com" (no /v1)
// - If not set, default is "https://api.fiskil.com"
const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

// Support both server + public env var names for Supabase URL/key
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Your app URL (used for cancel_uri)
const FRONTEND_URL =
  (process.env.FRONTEND_URL || "").replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

let cachedToken = null;
let cachedExpiry = 0;

function ensureConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase configuration missing on server");
  }
}

function getSupabaseAdminClient() {
  // Create inside handler so missing env doesn't crash module load
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function getFiskilAccessToken() {
  ensureConfig();

  const now = Date.now();
  if (cachedToken && cachedExpiry > now + 5000) return cachedToken;

  // ✅ Correct per Fiskil docs:
  // POST /v1/token with JSON { client_id, client_secret }
  const res = await fetch(`${FISKIL_API_URL}/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.access_token) {
    throw new Error(
      `Fiskil token error (${res.status}): ${json ? JSON.stringify(json) : "no json body"}`
    );
  }

  cachedToken = json.access_token;
  cachedExpiry = now + (Number(json.expires_in || 0) * 1000);
  return cachedToken;
}

async function fiskilRequest(path, options = {}) {
  const token = await getFiskilAccessToken();
  const url = `${FISKIL_API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // keep as text
  }

  if (!res.ok) {
    console.error("Fiskil HTTP error", { url, status: res.status, body });
    throw new Error(`Fiskil request failed (${res.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }

  return body;
}

// Extractors for Fiskil shapes
function extractEndUserId(payload) {
  if (!payload) return null;
  if (typeof payload === "object" && typeof payload.id === "string") return payload.id;
  if (payload.data && typeof payload.data.id === "string") return payload.data.id;
  if (Array.isArray(payload.data) && payload.data[0] && typeof payload.data[0].id === "string") return payload.data[0].id;
  return null;
}

function extractAuthUrl(payload) {
  if (!payload) return null;
  return (
    payload.auth_url ||
    payload.authUrl ||
    payload.url ||
    payload.redirect_url ||
    payload.redirectUrl ||
    null
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    ensureConfig();
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  const jwt = authHeader.replace("Bearer ", "").trim();
  const supabaseAdmin = getSupabaseAdminClient();

  // Verify the user via Supabase
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(jwt);
  const user = userData?.user;

  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // Load profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("fiskil_user_id,email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return res.status(500).json({ error: "Unable to load profile" });

  // Email source priority: request body -> profile -> auth user
  const rawEmail = req.body?.email || profile?.email || user.email;
  const email =
    typeof rawEmail === "string" && rawEmail.trim()
      ? rawEmail.toLowerCase().trim()
      : `user-${Date.now()}@example.com`;

  try {
    // 1) Ensure Fiskil end_user_id exists (stored in profiles.fiskil_user_id)
    let endUserId = profile?.fiskil_user_id || null;

    if (!endUserId) {
      const endUserPayload = await fiskilRequest("/v1/end-users", {
        method: "POST",
        body: JSON.stringify({
          email,
          name: email.split("@")[0] || "User",
        }),
      });

      endUserId = extractEndUserId(endUserPayload);
      if (!endUserId) {
        console.error("Fiskil end-user missing id", endUserPayload);
        return res.status(500).json({ error: "Could not create Fiskil end user", raw: endUserPayload || null });
      }

      await supabaseAdmin
        .from("profiles")
        .upsert({ id: user.id, email, fiskil_user_id: endUserId }, { onConflict: "id" });
    }

    // 2) Create auth session -> returns auth_url (consent URL)
    const cancelUri =
      FRONTEND_URL ? `${FRONTEND_URL}/dashboard?bankConnect=cancel` : "https://example.com/cancel";

    const authSessionPayload = await fiskilRequest("/v1/auth/session", {
      method: "POST",
      body: JSON.stringify({
        end_user_id: endUserId,
        cancel_uri: cancelUri,
      }),
    });

    const consentUrl = extractAuthUrl(authSessionPayload);
    if (!consentUrl) {
      console.error("Fiskil auth session missing auth_url", authSessionPayload);
      return res.status(500).json({ error: "Could not obtain consent URL from Fiskil", raw: authSessionPayload || null });
    }

    return res.status(200).json({
      userId: endUserId,
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