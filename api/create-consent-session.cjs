/* eslint-disable no-console */

// CommonJS file (.cjs) because project uses "type": "module" (ESM) and Vercel treats .js as ESM.
// This endpoint returns a Fiskil auth session (consent URL) for the logged-in Supabase user.

const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");

const FISKIL_BASE_URL = process.env.FISKIL_BASE_URL || "https://api.fiskil.com/v1";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function getBearer(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth) return null;
  const parts = String(auth).split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") return parts[1];
  return null;
}

async function fiskilToken() {
  const client_id = process.env.FISKIL_CLIENT_ID;
  const client_secret = process.env.FISKIL_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    throw new Error("Missing FISKIL_CLIENT_ID or FISKIL_CLIENT_SECRET env vars");
  }

  const r = await fetch(`${FISKIL_BASE_URL}/token`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ client_id, client_secret }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("FISKIL_TOKEN_ERROR", { status: r.status, data });
    throw new Error(`Fiskil token failed (${r.status})`);
  }

  if (!data.token) throw new Error("Fiskil token missing from response");
  return data.token;
}

async function fiskilRequest(path, token, options = {}) {
  const r = await fetch(`${FISKIL_BASE_URL}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(options.headers || {}),
      authorization: `Bearer ${token}`,
    },
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("FISKIL_HTTP_ERROR", {
      path,
      status: r.status,
      data,
    });
    const msg = data?.error || data?.message || `Fiskil request failed (${r.status})`;
    const e = new Error(msg);
    e.status = r.status;
    e.data = data;
    throw e;
  }

  return data;
}

async function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    // 1) Verify logged-in Supabase user from the client’s access token
    const bearer = getBearer(req);
    if (!bearer) return json(res, 401, { error: "Missing Authorization bearer token" });

    const supabaseAdmin = await getSupabaseAdmin();

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(bearer);
    if (userErr || !userData?.user) {
      console.error("SUPABASE_GET_USER_ERROR", userErr);
      return json(res, 401, { error: "Invalid user session" });
    }

    const appUser = userData.user;
    const appUserId = appUser.id;
    const email = appUser.email;

    if (!email) {
      return json(res, 400, { error: "Supabase user email is missing" });
    }

    // 2) Fetch profile (id + email are NOT NULL in your schema)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id,email,fiskil_user_id,full_name")
      .eq("id", appUserId)
      .maybeSingle();

    if (profileErr) {
      console.error("SUPABASE_PROFILE_LOOKUP_ERROR", profileErr);
      return json(res, 500, { error: "Profile lookup failed" });
    }

    // 3) Ensure profile row exists (for older accounts created before your trigger existed)
    if (!profile) {
      const { error: insertErr } = await supabaseAdmin.from("profiles").insert({
        id: appUserId,
        email,
        full_name: appUser.user_metadata?.full_name || appUser.user_metadata?.name || null,
      });

      if (insertErr) {
        console.error("SUPABASE_PROFILE_INSERT_ERROR", insertErr);
        return json(res, 500, { error: "Profile create failed" });
      }
    }

    // Re-fetch to get fiskil_user_id if it exists
    const { data: profile2, error: profile2Err } = await supabaseAdmin
      .from("profiles")
      .select("id,email,fiskil_user_id,full_name")
      .eq("id", appUserId)
      .single();

    if (profile2Err) {
      console.error("SUPABASE_PROFILE_LOOKUP_ERROR_2", profile2Err);
      return json(res, 500, { error: "Profile lookup failed" });
    }

    // 4) Ensure Fiskil end_user_id exists
    const fiskilAccessToken = await fiskilToken();

    let fiskilUserId = profile2.fiskil_user_id || null;

    if (!fiskilUserId) {
      // Try lookup by email (GET /v1/end-users?email=...)
      let found = null;
      try {
        const endUsers = await fiskilRequest(`/end-users?email=${encodeURIComponent(email)}`, fiskilAccessToken, {
          method: "GET",
        });
        if (Array.isArray(endUsers) && endUsers.length > 0) found = endUsers[0];
      } catch (e) {
        // If endpoint errors, we still try create below.
        console.error("FISKIL_END_USER_LOOKUP_ERROR", e?.data || e?.message || e);
      }

      if (found?.id) {
        fiskilUserId = found.id;
      } else {
        // Create (POST /v1/end-users)
        const created = await fiskilRequest("/end-users", fiskilAccessToken, {
          method: "POST",
          body: JSON.stringify({
            email,
            name: profile2.full_name || appUser.user_metadata?.full_name || appUser.user_metadata?.name || null,
          }),
        });

        // Docs show response may be { end_user_id: "..." } or { id: "..." }
        fiskilUserId = created?.end_user_id || created?.id || null;
      }

      if (!fiskilUserId) {
        return json(res, 500, { error: "Unable to create or find Fiskil end user id" });
      }

      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ fiskil_user_id: fiskilUserId })
        .eq("id", appUserId);

      if (updateErr) {
        console.error("SUPABASE_UPDATE_ERROR", updateErr);
        return json(res, 500, { error: "Failed to persist Fiskil end user id" });
      }
    }

    // 5) Create Auth Session (POST /v1/auth/session)
    // IMPORTANT: Fiskil expects field name `end_user_id`
    const session = await fiskilRequest("/auth/session", fiskilAccessToken, {
      method: "POST",
      body: JSON.stringify({ end_user_id: fiskilUserId }),
    });

    const consentUrl =
      session?.redirect_url || session?.consent_url || session?.url || session?.redirectUrl || null;

    if (!consentUrl) {
      console.error("FISKIL_AUTH_SESSION_NO_URL", session);
      return json(res, 500, { error: "Fiskil auth session missing redirect URL" });
    }

    return json(res, 200, { url: consentUrl, fiskil_user_id: fiskilUserId });
  } catch (err) {
    console.error("CREATE_CONSENT_SESSION_FATAL", err?.data || err);
    return json(res, 500, { error: "Unable to start bank connection" });
  }
};
