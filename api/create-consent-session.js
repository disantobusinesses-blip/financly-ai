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

async function getFiskilToken() {
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
    throw new Error("Failed to authenticate with Fiskil");
  }

  cachedToken = data.token;
  tokenExpiry = now + data.expires_in * 1000 - 5000;
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
    console.error("FISKIL API ERROR", path, data);
    throw new Error(data?.message || "Fiskil API request failed");
  }

  return data;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } =
      await supabase.auth.getUser(jwt);

    if (authError || !userData?.user) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    const userId = userData.user.id;
    const email = userData.user.email;

    // Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("fiskil_user_id")
      .eq("id", userId)
      .single();

    let fiskilUserId = profile?.fiskil_user_id;

    // Create End User once
    if (!fiskilUserId) {
      const endUser = await fiskilRequest("/end-users", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      fiskilUserId = endUser.id;

      await supabase
        .from("profiles")
        .update({ fiskil_user_id: fiskilUserId })
        .eq("id", userId);
    }

    // Create Auth Session (Connect Bank)
    const session = await fiskilRequest("/auth/session", {
  method: "POST",
  body: JSON.stringify({ end_user: fiskilUserId }),
});

    return res.status(200).json({
      redirect_url: session.redirect_url,
    });
  } catch (err) {
    console.error("CONNECT BANK ERROR", err);
    return res.status(500).json({
      error: "Unable to start bank connection",
      details: err.message,
    });
  }
}