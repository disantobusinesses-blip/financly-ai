const FISKIL_BASE_URL = "https://api.fiskil.com/v1";
const { FISKIL_CLIENT_ID, FISKIL_CLIENT_SECRET } = process.env;

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now) return cachedToken;

  const res = await fetch(`${FISKIL_BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("FISKIL TOKEN ERROR", data);
    throw new Error("Token error");
  }

  cachedToken = data.token;
  tokenExpiry = now + data.expires_in * 1000 - 5000;
  return cachedToken;
}

export default async function handler(req, res) {
  try {
    const path = req.query.path;
    if (!path) {
      return res.status(400).json({ error: "Missing path" });
    }

    const token = await getToken();
    const response = await fetch(`${FISKIL_BASE_URL}/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("FISKIL DATA ERROR", data);
      return res.status(500).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("FISKIL DATA PROXY ERROR", err);
    return res.status(500).json({ error: err.message });
  }
}