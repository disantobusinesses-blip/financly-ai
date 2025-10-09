// ✅ Force Node runtime (Vercel defaults to Edge otherwise)
export const config = {
  runtime: "nodejs",
  api: { bodyParser: true },
};

// ✅ Use built-in fetch (no need to import node-fetch)
const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 🔐 Safety check
    if (!BASIQ_API_KEY) {
      console.error("❌ Missing BASIQ_API_KEY");
      return res.status(500).json({ error: "Missing BASIQ_API_KEY in environment." });
    }

    // ✅ Generate random email if none provided
    const email =
      (req.body && req.body.email)
        ? req.body.email.toLowerCase()
        : `user-${Date.now()}@example.com`;

    const authorizationHeader = `Basic ${BASIQ_API_KEY}`;

    // 1️⃣ Get server token
    const tokenRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Server token failed: ${tokenRes.status} ${text}`);
    }

    const { access_token: SERVER_TOKEN } = await tokenRes.json();
    if (!SERVER_TOKEN) throw new Error("No SERVER_TOKEN returned by Basiq.");

    // 2️⃣ Create or reuse user
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
      // Email already exists, fetch it
      const lookupRes = await fetch(`${BASIQ_API_URL}/users?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${SERVER_TOKEN}`,
          "basiq-version": "3.0",
        },
      });
      const { data } = await lookupRes.json();
      if (!data || data.length === 0) throw new Error("User exists but not found via lookup.");
      userId = data[0].id;
    } else {
      const text = await userRes.text();
      throw new Error(`User creation failed: ${userRes.status} ${text}`);
    }

    // 3️⃣ Get client token for consent
    const clientRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "CLIENT_ACCESS", userId }),
    });

    if (!clientRes.ok) {
      const text = await clientRes.text();
      throw new Error(`Client token failed: ${clientRes.status} ${text}`);
    }

    const { access_token: CLIENT_TOKEN } = await clientRes.json();
    if (!CLIENT_TOKEN) throw new Error("No CLIENT_TOKEN returned by Basiq.");

    // ✅ Final consent link
    const consentUrl = `https://consent.basiq.io/home?token=${CLIENT_TOKEN}&action=connect`;

    return res.status(200).json({ consentUrl, userId });
  } catch (err) {
    console.error("❌ Error in /api/create-consent-session:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
