import { createClient } from "@supabase/supabase-js";

const FISKIL_BASE_URL = "https://api.fiskil.com/v1";

const {
  FISKIL_CLIENT_ID,
  FISKIL_CLIENT_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (
  !FISKIL_CLIENT_ID ||
  !FISKIL_CLIENT_SECRET ||
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error("Missing required environment variables");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// --------------------
// Fiskil auth handling
// --------------------
let cachedToken = null;
let tokenExpiresAt = 0;

async function getFiskilToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now) return cachedToken;

  const res = await fetch(`${FISKIL_BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data?.token) {
    console.error("FISKIL_TOKEN_ERROR", data);
    throw new Error("Failed to authenticate with Fiskil");
  }

  cachedToken = data.token;
  tokenExpiresAt = now + data.expires_in * 1000 - 5000;
  return cachedToken;
}

async function fiskilRequest(path, options = {}) {
  const token = await getFiskilToken();

  const res = await fetch(`${FISKIL_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("FISKIL_API_ERROR", path, data);
    throw new Error(data?.message || "Fiskil API request failed");
  }

  return data;
}

// --------------------
// API handler
// --------------------
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Validate Supabase session
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const jwt = authHeader.replace("Bearer ", "").trim();
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(jwt);

    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const appUserId = authData.user.id;
    const email = authData.user.email;

    if (!email) {
      return res.status(400).json({ error: "User email missing" });
    }

    // Load profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("fiskil_user_id")
      .eq("id", appUserId)
      .single();

    if (profileError) {
      console.error("SUPABASE_PROFILE_ERROR", profileError);
      return res.status(500).json({ error: "Profile lookup failed" });
    }

    let fiskilUserId = profile?.fiskil_user_id;

    // Create End User once
    if (!fiskilUserId) {
      const endUser = await fiskilRequest("/end-users", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      fiskilUserId = endUser.id;

      if (!fiskilUserId) {
        throw new Error("Fiskil end user ID missing from response");
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ fiskil_user_id: fiskilUserId })
        .eq("id", appUserId);

      if (updateError) {
        console.error("SUPABASE_UPDATE_ERROR", updateError);
        throw new Error("Failed to persist Fiskil user ID");
      }
    }

    // Create Auth Session (THIS IS THE FIX)
    const session = await fiskilRequest("/auth/session", {
      method: "POST",
      body: JSON.stringify({
        end_user: fiskilUserId, // <-- REQUIRED FIELD NAME
      }),
    });

    if (!session?.redirect_url) {
      console.error("FISKIL_SESSION_ERROR", session);
      throw new Error("Missing redirect_url from Fiskil");
    }

    return res.status(200).json({
      redirect_url: session.redirect_url,
    });
  } catch (err) {
    console.error("CREATE_CONSENT_SESSION_ERROR", err);
    return res.status(500).json({
      error: "Unable to start bank connection",
      details: err.message,
    });
  }
}