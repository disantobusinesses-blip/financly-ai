import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const FISKIL_BASE = "https://api.fiskil.com/v1";
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureFiskilConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
}

function createSupabaseServerClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  });
}

// -------------------------------------------------------------
// 1. GET FISKIL ACCESS TOKEN
// -------------------------------------------------------------
async function getAccessToken() {
  ensureFiskilConfig();

  const res = await fetch(`${FISKIL_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Fiskil token request failed: " + text);
  }

  const json = await res.json();
  return json.access_token;
}

// -------------------------------------------------------------
// 2. FISKIL API HELPER
// -------------------------------------------------------------
async function fiskil(path, method = "GET", body = null) {
  const token = await getAccessToken();

  const res = await fetch(`${FISKIL_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fiskil error ${res.status}: ${text}`);
  }

  return res.json();
}

// -------------------------------------------------------------
// 3. MAIN HANDLER
// -------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // Authenticate user
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const supabase = createSupabaseServerClient(token);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const email = user.email;
    if (!email) return res.status(400).json({ error: "Missing email" });

    // -------------------------------------------------------------
    // 4. CREATE OR GET FISKIL END USER
    // -------------------------------------------------------------
    let fiskilUserId = null;

    try {
      // Try creating a user
      const created = await fiskil("/end-users", "POST", {
        email: email,
        name: email
      });
      fiskilUserId = created.end_user_id || created.id;
    } catch (e) {
      // If already exists, fetch existing users
      const found = await fiskil(`/end-users?email=${encodeURIComponent(email)}`);
      if (found?.end_user_id) fiskilUserId = found.end_user_id;
      if (!fiskilUserId) throw e;
    }

    // -------------------------------------------------------------
    // 5. CREATE AUTH SESSION (CONNECT BANK)
    // -------------------------------------------------------------
    const authSession = await fiskil("/auth/session", "POST", {
      cancel_uri: "https://myaibank.ai/cancel",
      end_user_id: fiskilUserId
    });

    const consentUrl = authSession.auth_url;

    // Save Fiskil user ID
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          basiq_user_id: fiskilUserId,
          has_bank_connection: false
        },
        { onConflict: "id" }
      );

    return res.status(200).json({
      consentUrl,
      userId: fiskilUserId
    });
  } catch (err) {
    console.error("start-consent error", err);
    return res.status(500).json({
      error: "Unable to start bank connection",
      detail: err.message
    });
  }
}