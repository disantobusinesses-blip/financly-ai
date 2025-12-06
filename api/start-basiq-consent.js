import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const FISKIL_API_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wyommhasmvdhqxwehhel.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureFiskilConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
}

function createSupabaseServerClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  });
}

/**
 * Generic Fiskil request helper.
 *
 * NOTE: Update the auth header names below to match the Authentication docs.
 * Many client-based APIs use something like:
 *   "X-Client-Id" / "X-Client-Secret"
 * but you must use the exact names from https://docs.fiskil.com/authentication.
 */
async function fiskilRequest(path, options = {}) {
  ensureFiskilConfig();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // TODO: change these header keys if the docs use different names.
  headers["X-Client-Id"] = FISKIL_CLIENT_ID;
  headers["X-Client-Secret"] = FISKIL_CLIENT_SECRET;

  const url = `${FISKIL_API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("start-consent fiskil error", res.status, body);
    throw new Error(body || res.statusText);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    console.error("start-consent error: missing Fiskil configuration", {
      hasClientId: Boolean(FISKIL_CLIENT_ID),
      hasClientSecret: Boolean(FISKIL_CLIENT_SECRET),
    });
    return res.status(500).json({ error: "Fiskil configuration missing on server" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const supabaseAuth = createSupabaseServerClient(token);
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !authData?.user) return res.status(401).json({ error: "Not authenticated" });

    const userId = authData.user.id;
    const email = authData.user.email || req.body?.email;
    if (!email) return res.status(400).json({ error: "missing email" });

    const { data: profileData, error: profileError } = await supabaseAuth
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profileData) {
      const { error: upsertError } = await supabaseAuth
        .from("profiles")
        .upsert({ id: userId, email }, { onConflict: "id" })
        .select()
        .single();
      if (upsertError) throw upsertError;
    }

    // Create / lookup Fiskil user
    let fiskilUserId = profileData?.basiq_user_id || null;
    if (!fiskilUserId) {
      try {
        // NOTE: update the URL to the exact "create user" path in the Fiskil Banking API docs.
        const created = await fiskilRequest("/banking/v2/users", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        fiskilUserId = created?.id;
      } catch (createErr) {
        // Attempt to find existing user by email if already created
        const lookup = await fiskilRequest(`/banking/v2/users?email=${encodeURIComponent(email)}`, {
          method: "GET",
        });
        fiskilUserId = Array.isArray(lookup?.data) ? lookup.data[0]?.id : lookup?.id;
        if (!fiskilUserId) throw createErr;
      }
    }

    // Create a Link token / consent session
    // NOTE: check the Fiskil Link Widget docs for the exact endpoint + body.
    const linkToken = await fiskilRequest("/link/token", {
      method: "POST",
      body: JSON.stringify({
        userId: fiskilUserId,
        products: ["banking"],
      }),
    });

    const consentUrl =
      linkToken?.url ||
      linkToken?.linkTokenUrl ||
      linkToken?.link_url ||
      linkToken?.linkToken ||
      linkToken?.redirectUrl;

    await supabaseAuth
      .from("profiles")
      .upsert(
        { id: userId, email, basiq_user_id: fiskilUserId, has_bank_connection: true },
        { onConflict: "id" },
      )
      .select()
      .single();

    return res.status(200).json({ consentUrl, userId: fiskilUserId });
  } catch (err) {
    console.error("start-consent error", err);
    if (err?.response) {
      console.error("start-consent response error", err.response.status, err.response.data);
    }
    const detail = err?.message;
    return res.status(500).json({ error: "Unable to start bank connection", detail });
  }
}