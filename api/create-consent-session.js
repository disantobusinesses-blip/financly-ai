// 🚀 REPLACEMENT FOR: /api/create-consent-session.js
// Node 18+ (Vercel) uses native fetch. No node-fetch import.
// Robust: server-token caching, existing-user reuse, clear errors.

const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");
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
      Authorization: `Basic ${Buffer.from(`${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`).toString("base64")}`,
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
  const res = await fetch(`${FISKIL_API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Fiskil request failed: ${t}`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    return res.status(500).json({ error: "Fiskil configuration missing on server" });
  }

  try {
    const email = req.body?.email?.toLowerCase()?.trim() || `user-${Date.now()}@example.com`;

    const userPayload = await fiskilRequest("/banking/v2/users", {
      method: "POST",
      body: JSON.stringify({ email }),
    }).catch(async (err) => {
      // try lookup if already exists
      const lookup = await fiskilRequest(`/banking/v2/users?email=${encodeURIComponent(email)}`);
      if (Array.isArray(lookup?.data) && lookup.data[0]?.id) return lookup;
      throw err;
    });

    const userId = userPayload?.id || userPayload?.data?.[0]?.id;
    if (!userId) throw new Error("Unable to create or locate Fiskil user");

    const link = await fiskilRequest("/link/token", {
      method: "POST",
      body: JSON.stringify({ userId, products: ["banking"] }),
    });

    const consentUrl = link?.url || link?.linkTokenUrl || link?.link_url || link?.redirectUrl;

    // Frontend should store userId and navigate to consentUrl
    return res.status(200).json({ consentUrl, userId });
  } catch (err) {
    console.error("❌ /api/create-consent-session error:", err);
    return res.status(500).json({
      error: "Unable to start bank connection",
      details: String(err?.message || err),
    });
  }
}
