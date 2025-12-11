const FISKIL_API_URL = "https://api.fiskil.com/v1";
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

let cachedToken = null;
let cachedExpiry = 0;

async function getFiskilAccessToken() {
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

  const json = await res.json();
  cachedToken = json.access_token;
  cachedExpiry = now + json.expires_in * 1000;
  return cachedToken;
}

async function fiskil(path, opts = {}) {
  const token = await getFiskilAccessToken();
  const res = await fetch(`${FISKIL_API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });

  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return txt;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const email = req.body?.email?.toLowerCase().trim();

    // 1. Create Fiskil user (idempotent)
    const userResp = await fiskil(`/banking/v2/users`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }).catch(async () => {
      return fiskil(`/banking/v2/users?email=${encodeURIComponent(email)}`);
    });

    const userId = userResp?.id || userResp?.data?.[0]?.id;
    if (!userId) throw new Error("Could not create/find Fiskil user");

    // 2. Create link token
    const link = await fiskil(`/link/token`, {
      method: "POST",
      body: JSON.stringify({ userId, products: ["banking"] }),
    });

    const consentUrl = link?.url || link?.redirectUrl;

    return res.status(200).json({ userId, consentUrl });
  } catch (err) {
    console.error("❌ create-consent-session:", err);
    return res.status(500).json({ error: err.message });
  }
}
