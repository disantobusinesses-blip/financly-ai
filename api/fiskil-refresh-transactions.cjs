import { createClient } from "@supabase/supabase-js";

const FISKIL_BASE_URL = "https://api.fiskil.com/v1";
const {
  FISKIL_CLIENT_ID,
  FISKIL_CLIENT_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

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
  if (!res.ok) throw new Error("Token error");

  cachedToken = data.token;
  tokenExpiry = now + data.expires_in * 1000 - 5000;
  return cachedToken;
}

export default async function handler(req, res) {
  try {
    const { end_user_id } = req.body;
    if (!end_user_id) {
      return res.status(400).json({ error: "Missing end_user_id" });
    }

    const token = await getToken();

    const txRes = await fetch(
      `${FISKIL_BASE_URL}/banking/transactions?end_user_id=${end_user_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const transactions = await txRes.json();
    if (!txRes.ok) throw new Error("Transaction fetch failed");

    return res.status(200).json({ transactions });
  } catch (err) {
    console.error("TX REFRESH ERROR", err);
    return res.status(500).json({ error: err.message });
  }
}