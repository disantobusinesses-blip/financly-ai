// api/fiskil-data.js

const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;
const BASE_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com/v1").replace(/\/$/, "");

let cachedToken = null;
let cachedExpiry = 0;

function ensureFiskilConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
}

async function token() {
  ensureFiskilConfig();

  const now = Date.now();
  if (cachedToken && cachedExpiry > now + 5000) return cachedToken;

  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const bodyText = await response.text();

  if (!response.ok) {
    console.error("FISKIL_HTTP_ERROR", { url: `${BASE_URL}/oauth/token`, status: response.status, body: bodyText });
    throw new Error(`Fiskil token request failed (${response.status}): ${bodyText}`);
  }

  const json = JSON.parse(bodyText);
  cachedToken = json.access_token;
  cachedExpiry = now + (json.expires_in ? json.expires_in * 1000 : 50 * 60 * 1000);
  return cachedToken;
}

export default async function handler(req, res) {
  try {
    const accessToken = await token();

    const path = req.query.path;
    if (!path || typeof path !== "string") {
      return res.status(400).json({ error: "Missing path query param" });
    }

    const fiskilRes = await fetch(`${BASE_URL}/${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const text = await fiskilRes.text();

    if (!fiskilRes.ok) {
      console.error("FISKIL_HTTP_ERROR", { url: `${BASE_URL}/${path}`, status: fiskilRes.status, body: text });
      return res.status(502).json({ error: "Fiskil request failed", status: fiskilRes.status, body: text });
    }

    // return JSON if possible
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).send(text);
    }
  } catch (error) {
    console.error("❌ /api/fiskil-data error:", error);
    return res.status(500).json({ error: "Server error", details: String(error?.message || error) });
  }
}