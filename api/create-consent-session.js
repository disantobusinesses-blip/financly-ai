// 🚀 REPLACEMENT FOR: /api/create-consent-session.js
// Node 18+ (Vercel) uses native fetch. No node-fetch import.
// Robust: server-token caching, existing-user reuse, clear errors.

const BASIQ_API_KEY = process.env.BASIQ_API_KEY; // should include or be without "Basic", we normalize below
const BASIQ_API_URL = "https://au-api.basiq.io";

// in-memory cache for server token (lives per serverless instance)
let CACHED_SERVER_TOKEN = null;
let SERVER_TOKEN_EXPIRY = 0; // epoch ms

function normalizedBasicKey() {
  if (!BASIQ_API_KEY) throw new Error("Missing BASIQ_API_KEY env var");
  const raw = BASIQ_API_KEY.trim();
  return raw.startsWith("Basic ") ? raw : `Basic ${raw}`;
}

async function getServerToken() {
  const now = Date.now();
  if (CACHED_SERVER_TOKEN && now < SERVER_TOKEN_EXPIRY) return CACHED_SERVER_TOKEN;

  const res = await fetch(`${BASIQ_API_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: normalizedBasicKey(),
      "Content-Type": "application/x-www-form-urlencoded",
      "basiq-version": "3.0",
    },
    body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to get server token: ${t}`);
  }
  const { access_token } = await res.json();
  // token validity 60m; refresh a bit earlier
  CACHED_SERVER_TOKEN = access_token;
  SERVER_TOKEN_EXPIRY = now + 55 * 60 * 1000;
  return CACHED_SERVER_TOKEN;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const email =
      req.body?.email?.toLowerCase()?.trim() || `user-${Date.now()}@example.com`;

    const SERVER_TOKEN = await getServerToken();

    // 1) Create (or reuse) user for this email
    let userId;
    const createRes = await fetch(`${BASIQ_API_URL}/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "Content-Type": "application/json",
        "basiq-version": "3.0",
      },
      body: JSON.stringify({ email }),
    });

    if (createRes.status === 201) {
      const user = await createRes.json();
      userId = user.id;
    } else if (createRes.status === 409) {
      // lookup existing user
      const lookup = await fetch(
        `${BASIQ_API_URL}/users?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${SERVER_TOKEN}`, "basiq-version": "3.0" } }
      );
      if (!lookup.ok) throw new Error(`User conflict but lookup failed: ${await lookup.text()}`);
      const { data } = await lookup.json();
      userId = data?.[0]?.id;
      if (!userId) throw new Error("User exists but could not be fetched");
    } else {
      throw new Error(`Create user failed: ${await createRes.text()}`);
    }

    // 2) Get CLIENT token bound to userId
    const clientTok = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: normalizedBasicKey(),
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "CLIENT_ACCESS", userId }),
    });
    if (!clientTok.ok) throw new Error(`Failed to get client token: ${await clientTok.text()}`);
    const { access_token: CLIENT_TOKEN } = await clientTok.json();

    // 3) Consent UI URL (return to your site via Basiq app setting redirect)
    const consentUrl = `https://consent.basiq.io/home?token=${CLIENT_TOKEN}&action=connect`;

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