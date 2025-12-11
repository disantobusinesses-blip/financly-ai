// api/start-fiskil-auth-session.js

const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

const BASE_URL = "https://api.fiskil.com/v1"; // FIXED

let cachedToken = null;
let cachedExpiry = 0;

async function getFiskilAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedExpiry > now + 5000) return cachedToken;

  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const json = await response.json();
  const token = json.access_token;

  cachedToken = token;
  cachedExpiry = now + json.expires_in * 1000;

  return token;
}

async function createEndUser(accessToken, email) {
  const res = await fetch(`${BASE_URL}/enduser`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  return res.json();
}

async function createAuthSession(accessToken, userId) {
  const res = await fetch(`${BASE_URL}/auth/session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endUserId: userId,
      redirectUrl: `${process.env.PUBLIC_URL}/onboarding`,
      consentScopes: ["accounts", "transactions"],
    }),
  });

  return res.json();
}

export default async function handler(req, res) {
  try {
    const { email } = req.body;

    const token = await getFiskilAccessToken();
    const user = await createEndUser(token, email);
    const session = await createAuthSession(token, user.id);

    return res.status(200).json({
      userId: user.id,
      consentUrl: session.consentUrl,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Unable to start bank connection",
      detail: err.message,
    });
  }
}
