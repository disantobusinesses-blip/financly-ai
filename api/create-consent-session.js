// api/create-consent-session.js

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

export default async function handler(req, res) {
  // ✅ Allow both iPhone & desktop CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    if (!BASIQ_API_KEY) throw new Error("Missing BASIQ_API_KEY");

    const email =
      (req.body && req.body.email)
        ? req.body.email.toLowerCase()
        : `user-${Date.now()}@example.com`;

    const authorizationHeader = `Basic ${BASIQ_API_KEY}`;

    // STEP 1️⃣ — Get server token
    const serverTokRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
    });

    if (!serverTokRes.ok) {
      const text = await serverTokRes.text();
      throw new Error(`Server token error: ${text}`);
    }

    const { access_token: SERVER_TOKEN } = await serverTokRes.json();

    // STEP 2️⃣ — Create or reuse sandbox user
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
      if (!data?.length) throw new Error("User exists but could not be fetched");
      userId = data[0].id;
    } else {
      throw new Error(await userRes.text());
    }

    // STEP 3️⃣ — Get client token for consent
    const clientTokRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "CLIENT_ACCESS", userId }),
    });

    if (!clientTokRes.ok) {
      const errText = await clientTokRes.text();
      throw new Error(`Client token error: ${errText}`);
    }

    const { access_token: CLIENT_TOKEN } = await clientTokRes.json();

    // ✅ Always full HTTPS URL for Safari
    const consentUrl = `https://consent.basiq.io/home?token=${CLIENT_TOKEN}&action=connect`;

    // ✅ Return the URL & userId safely
    return res.status(200).json({ consentUrl, userId });
  } catch (err) {
    console.error("❌ Error in /api/create-consent-session:", err);
    return res
      .status(500)
      .json({ error: err.message || "Unable to create consent session" });
  }
}

// ✅ Node runtime for full fetch support (fixes desktop)
export const config = {
  runtime: "nodejs",
};
