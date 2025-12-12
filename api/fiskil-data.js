// api/fiskil-data.js

const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;
const BASE_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com/v1").replace(/\/$/, ""); // FIXED

let cachedToken = null;
let cachedExpiry = 0;

async function token() {
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
  cachedToken = json.access_token;
  cachedExpiry = now + json.expires_in * 1000;

  return cachedToken;
}

export default async function handler(req, res) {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    return res.status(500).json({ error: "Fiskil configuration missing on server" });
  }

  try {
    const accessToken = await token();

    const path = req.query.path;
    const fiskil = await fetch(`${BASE_URL}/${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await fiskil.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Fiskil data error",
      detail: error.message,
    });
  }
}
