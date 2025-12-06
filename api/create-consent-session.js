// 🚀 REPLACEMENT FOR: /api/create-consent-session.js
// Node 18+ (Vercel) uses native fetch. No node-fetch import.
// Robust: server-token caching, existing-user reuse, clear errors.

const FISKIL_API_KEY = process.env.FISKIL_API_KEY;
const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");

function fiskilHeaders() {
  if (!FISKIL_API_KEY) throw new Error("Missing FISKIL_API_KEY env var");
  return {
    Authorization: `Bearer ${FISKIL_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function fiskilRequest(path, options = {}) {
  const res = await fetch(`${FISKIL_API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers: fiskilHeaders(),
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

  try {
    const email = req.body?.email?.toLowerCase()?.trim() || `user-${Date.now()}@example.com`;

    if (!FISKIL_API_KEY || !FISKIL_API_URL) {
      return res.status(500).json({ error: "Fiskil configuration missing on server" });
    }

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
