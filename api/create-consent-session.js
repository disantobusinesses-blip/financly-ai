// api/create-consent-session.js
// Node 18+ (Vercel) uses native fetch.

const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com/v1").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

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
    throw new Error(`Fiskil request failed (${res.status}): ${bodyText}`);
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

  const rawEmail = req.body?.email;
  const email =
    typeof rawEmail === "string" && rawEmail.trim()
      ? rawEmail.toLowerCase().trim()
      : `user-${Date.now()}@example.com`;

  try {
    let userPayload;

    // 1) Try to create the user
    try {
      userPayload = await fiskilRequest("/banking/v2/users", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (createErr) {
      // 2) If create fails, try to look up by email
      try {
        userPayload = await fiskilRequest(`/banking/v2/users?email=${encodeURIComponent(email)}`, {
          method: "GET",
        });
      } catch (lookupErr) {
        console.error("❌ Fiskil user create + lookup failed:", createErr, lookupErr);
        throw new Error("Fiskil user create and lookup both failed");
      }
    }

    const userId = extractUserId(userPayload);

    if (!userId) {
      console.error("❌ Fiskil user payload had no id:", JSON.stringify(userPayload));
      return res.status(500).json({
        error: "Could not create/find Fiskil user",
        raw: userPayload || null,
      });
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
