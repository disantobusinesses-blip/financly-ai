import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function ensureFiskilConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
}

function createSupabaseServerClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  });
}

async function getFiskilAccessToken() {
  ensureFiskilConfig();
  const response = await fetch("https://api.fiskil.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to obtain Fiskil token (${response.status}): ${detail}`);
  }

  const json = await response.json();
  if (!json?.access_token) {
    throw new Error("Fiskil token response missing access_token");
  }
  return json.access_token;
}

async function createFiskilEndUser(accessToken, email, name) {
  const response = await fetch("https://api.fiskil.com/v1/end-users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, name }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to create Fiskil end user (${response.status}): ${detail}`);
  }

  return response.json();
}

async function createFiskilAuthSession(accessToken, endUserId, cancelUri) {
  const response = await fetch("https://api.fiskil.com/v1/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ cancel_uri: cancelUri, end_user_id: endUserId }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to create Fiskil auth session (${response.status}): ${detail}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    ensureFiskilConfig();

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const supabase = createSupabaseServerClient(token);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) return res.status(401).json({ error: "Not authenticated" });

    const userId = authData.user.id;
    const email = req.body?.email || authData.user.email;
    const name =
      req.body?.name ||
      authData.user.user_metadata?.full_name ||
      authData.user.user_metadata?.name ||
      authData.user.email ||
      "MyAiBank User";

    if (!email) return res.status(400).json({ error: "missing email" });

    const accessToken = await getFiskilAccessToken();
    const endUser = await createFiskilEndUser(accessToken, email, name);
    const endUserId = endUser?.id;

    if (!endUserId) {
      throw new Error("Fiskil end user id missing");
    }

    const cancelUri = req.body?.cancel_uri || `${req.headers.origin || ""}/onboarding`;
    const authSession = await createFiskilAuthSession(accessToken, endUserId, cancelUri);
    const consentUrl = authSession?.auth_url || authSession?.authUrl || authSession?.redirect_url;

    await supabase
      .from("profiles")
      .upsert(
        { id: userId, email, basiq_user_id: endUserId, has_bank_connection: false },
        { onConflict: "id" }
      )
      .select()
      .single();

    return res.status(200).json({ consentUrl, userId: endUserId });
  } catch (error) {
    console.error("start-fiskil-auth-session error", error);
    return res.status(500).json({ error: "Unable to start bank connection", detail: error?.message });
  }
}
