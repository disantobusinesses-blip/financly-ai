import { createClient } from "@supabase/supabase-js";

const FISKIL_API_URL = "https://api.fiskil.com/v1";
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

let cachedToken = null;
let cachedExpiry = 0;

async function getToken() {
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

async function fiskil(path) {
  const token = await getToken();
  const r = await fetch(`${FISKIL_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing auth" });

  const jwt = auth.replace("Bearer ", "");
  const { data: user } = await supabase.auth.getUser(jwt);

  if (!user) return res.status(401).json({ error: "Invalid session" });

  const userId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("fiskil_user_id,last_transactions_sync_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.fiskil_user_id)
    return res.status(400).json({ error: "No connected bank" });

  const from = profile.last_transactions_sync_at
    ? `?from=${profile.last_transactions_sync_at}`
    : "";

  const tx = await fiskil(
    `/banking/v2/users/${profile.fiskil_user_id}/transactions${from}`
  );

  const transactions = tx?.data || [];

  if (transactions.length) {
    const formatted = transactions.map((t) => ({
      id: t.id,
      user_id: userId,
      amount: t.amount,
      date: t.date,
      description: t.description,
      account_id: t.accountId,
      category: t.category,
    }));

    await supabase.from("transactions").upsert(formatted, {
      onConflict: "id",
    });
  }

  await supabase
    .from("profiles")
    .update({
      last_transactions_sync_at: new Date().toISOString(),
      has_bank_connection: true,
    })
    .eq("id", userId);

  return res.status(200).json({ success: true });
}
