// /api/create-consent-session.js
// ESM-safe (project has "type": "module"), Node 18+ uses native fetch.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fiskil v1 base
const FISKIL_BASE_URL = (process.env.FISKIL_BASE_URL || "https://api.fiskil.com/v1").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

function getBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h) return null;
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

function mustEnv(name, value) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const supabaseAdmin = (() => {
  mustEnv("SUPABASE_URL", SUPABASE_URL);
  mustEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
})();

// Token cache (per warm lambda instance)
let cachedToken = null;
let cachedTokenExpMs = 0;

async function getFiskilToken() {
  mustEnv("FISKIL_CLIENT_ID", FISKIL_CLIENT_ID);
  mustEnv("FISKIL_CLIENT_SECRET", FISKIL_CLIENT_SECRET);

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpMs - 15_000) return cachedToken;

  const r = await fetch(`${FISKIL_BASE_URL}/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
    }),
  });

  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!r.ok) {
    throw new Error(`Fiskil token failed (${r.status}): ${text}`);
  }

  if (!data?.token) {
    throw new Error(`Fiskil token missing in response: ${text}`);
  }

  const expiresIn = Number(data.expires_in ?? 600);
  cachedToken = data.token;
  cachedTokenExpMs = now + expiresIn * 1000;
  return cachedToken;
}

async function fiskilRequest(path, { method = "GET", body } = {}) {
  const token = await getFiskilToken();

  const r = await fetch(`${FISKIL_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json; charset=UTF-8",
      authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!r.ok) {
    throw new Error(`Fiskil ${method} ${path} failed (${r.status}): ${text}`);
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1) Identify logged-in user via Supabase access token
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({
        error: "Unauthorized",
        details: "Missing Authorization: Bearer <supabase_access_token>",
      });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return res.status(401).json({
        error: "Unauthorized",
        details: userErr?.message || "Invalid Supabase session",
      });
    }

    const user = userData.user;
    const userId = user.id;
    const email = (user.email || "").trim().toLowerCase();

    if (!email) {
      // Your profiles.email is NOT NULL
      return res.status(400).json({ error: "User email missing" });
    }

    // 2) Ensure profiles row exists (email NOT NULL)
    // This fixes older accounts that were created before profiles row existed.
    const { data: profile, error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("id,email,fiskil_user_id")
      .single();

    if (upsertErr) {
      throw new Error(`Profile upsert failed: ${upsertErr.message}`);
    }

    let fiskilEndUserId = profile?.fiskil_user_id || null;

    // 3) Create or reuse Fiskil End User (store it in profiles.fiskil_user_id)
    if (!fiskilEndUserId) {
      // Try lookup by email (if supported); if it fails, just create.
      let foundId = null;
      try {
        const lookup = await fiskilRequest(`/end-users?email=${encodeURIComponent(email)}`, { method: "GET" });
        const arr = Array.isArray(lookup) ? lookup : lookup?.data;
        const first = arr?.[0];
        foundId = first?.id || first?.end_user_id || null;
      } catch {
        // ignore and create below
      }

      if (!foundId) {
        const created = await fiskilRequest("/end-users", {
          method: "POST",
          body: {
            email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          },
        });
        foundId = created?.end_user_id || created?.id || null;
      }

      if (!foundId) {
        throw new Error("Fiskil end user create/lookup failed (no id returned)");
      }

      fiskilEndUserId = foundId;

      const { error: saveErr } = await supabaseAdmin
        .from("profiles")
        .update({ fiskil_user_id: fiskilEndUserId, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (saveErr) {
        throw new Error(`Failed to persist fiskil_user_id: ${saveErr.message}`);
      }
    }

    // 4) Create Auth Session (field MUST be end_user_id)
    const session = await fiskilRequest("/auth/session", {
      method: "POST",
      body: { end_user_id: fiskilEndUserId },
    });

    const redirectUrl = session?.redirect_url || session?.url || null;
    if (!redirectUrl) {
      return res.status(500).json({
        error: "Missing redirect_url from Fiskil",
        raw: session ?? null,
      });
    }

    return res.status(200).json({
      end_user_id: fiskilEndUserId,
      redirect_url: redirectUrl,
    });
  } catch (err) {
    console.error("❌ /api/create-consent-session error:", err);
    return res.status(500).json({
      error: "Unable to start bank connection",
      details: String(err?.message || err),
    });
  }
}
