// ✅ /api/create-consent-session.js
// Uses Vercel's built-in fetch (no node-fetch import required)

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    if (!BASIQ_API_KEY) {
      throw new Error("Missing BASIQ_API_KEY in environment variables");
    }

    // ✅ Default unique sandbox email if not provided
    const email =
      req.body?.email?.toLowerCase() || `user-${Date.now()}@example.com`;

    const authHeader = `Basic ${BASIQ_API_KEY.replace(/^Basic\s*/i, "")}`;

    // 🟢 1. Request server token
    const tokenRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Failed to get server token: ${text}`);
    }

    const { access_token: SERVER_TOKEN } = await tokenRes.json();

    // 🟢 2. Create sandbox user (or reuse)
    let userId;
    const userRes = await fetch(`${BASIQ_API_URL}/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "Content-Type": "application/json",
        "basiq-version": "3.0",
      },
      body: JSON.stringify({ email }),
    });

    if (userRes.status === 201) {
      const user = await userRes.json();
      userId = user.id;
    } else if (userRes.status === 409) {
      const lookupRes = await fetch(
        `${BASIQ_API_URL}/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${SERVER_TOKEN}`,
            "basiq-version": "3.0",
          },
        }
      );
      if (!lookupRes.ok) throw new Error(await lookupRes.text());
      const { data } = await lookupRes.json();
      userId = data[0]?.id;
      if (!userId) throw new Error("User exists but could not be fetched");
    } else {
      const text = await userRes.text();
      throw new Error(`Failed to create Basiq user: ${text}`);
    }

    // 🟢 3. Request client token for consent
    const clientTokRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "CLIENT_ACCESS", userId }),
    });

    if (!clientTokRes.ok) {
      const text = await clientTokRes.text();
      throw new Error(`Failed to get client token: ${text}`);
    }

    const { access_token: CLIENT_TOKEN } = await clientTokRes.json();

    // 🟢 4. Build consent URL
    const consentUrl = `https://consent.basiq.io/home?token=${CLIENT_TOKEN}&action=connect`;

    // ✅ Return successful response
    return res.status(200).json({ consentUrl, userId });
  } catch (err) {
    console.error("❌ Error in /api/create-consent-session:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
}
