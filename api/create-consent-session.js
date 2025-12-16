// api/create-consent-session.js  (CommonJS for Vercel Serverless Functions)

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const safeJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
};

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");

const ensureHttpsOrigin = (url) => {
  const normalized = normalizeBase(url);
  if (!normalized) return normalized;

  if (normalized.startsWith("http://")) return `https://${normalized.slice("http://".length)}`;
  if (!/^https?:\/\//i.test(normalized)) return `https://${normalized}`;
  return normalized;
};

const originFromReq = (req) => {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
};

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const {
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      FISKIL_CLIENT_ID,
      FISKIL_CLIENT_SECRET,
      FISKIL_BASE_URL,
      FRONTEND_URL,
    } = process.env;

    const missing = [];
    if (!SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!FISKIL_CLIENT_ID) missing.push("FISKIL_CLIENT_ID");
    if (!FISKIL_CLIENT_SECRET) missing.push("FISKIL_CLIENT_SECRET");
    if (!FISKIL_BASE_URL) missing.push("FISKIL_BASE_URL");
    if (missing.length) return json(res, 500, { error: "Server misconfigured", missing });

    const base = normalizeBase(FISKIL_BASE_URL);
    const origin = ensureHttpsOrigin(FRONTEND_URL || originFromReq(req));
    const redirect_uri = `${origin}/onboarding`;
    const cancel_uri = `${origin}/onboarding`;

    // IMPORTANT: load supabase-js (ESM) from a CommonJS function
    const { createClient } = await import("@supabase/supabase-js");

    // -------- get user from Supabase --------
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json(res, 401, { error: "Missing Authorization header" });
    }

    const accessToken = authHeader.slice("Bearer ".length);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Checkpoint 0: validating Supabase user");
    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);

    if (userErr || !userData?.user) {
      console.error("Supabase getUser failed:", userErr);
      return json(res, 401, { error: "Invalid session" });
    }

    const user = userData.user;

    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("fiskil_user_id,email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      console.error("Supabase profile fetch failed:", profileErr);
      return json(res, 500, { error: "Unable to load profile" });
    }

    const userEmail = profileData?.email || user.email || req.body?.email;

    // -------- STEP 1: get Fiskil token --------
    console.log("Checkpoint A: about to call Fiskil token", { base });

    let tokenRes;
    try {
      tokenRes = await fetch(`${base}/v1/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: FISKIL_CLIENT_ID,
          client_secret: FISKIL_CLIENT_SECRET,
        }),
      });
    } catch (err) {
      console.error("Fiskil /v1/token fetch failed:", err, "cause:", err?.cause);
      return json(res, 500, {
        error: "Fiskil /v1/token fetch failed",
        cause: String(err?.cause || err),
      });
    }

    console.log("Checkpoint B: token response", tokenRes.status);
    const tokenJson = await safeJson(tokenRes);

    if (!tokenRes.ok || !tokenJson.token) {
      console.error("Token error body:", { status: tokenRes.status, body: tokenJson });
      return json(res, 500, {
        error: "Failed to authenticate with Fiskil",
        status: tokenRes.status,
        tokenJson,
      });
    }

    const fiskilToken = tokenJson.token;

    // -------- STEP 2: create end user --------
    console.log("Checkpoint B1: creating Fiskil end user");
    const endUserRes = await fetch(`${base}/v1/end-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${fiskilToken}`,
      },
      body: JSON.stringify({
        reference: user.id,
        email: userEmail,
      }),
    });

    const endUserJson = await safeJson(endUserRes);

    // Accept both success shapes:
    // - { id: 'eu_...' }
    // - { end_user_id: 'eu_...' }
    const fiskilEndUserId = endUserJson?.id || endUserJson?.end_user_id;

    if (!endUserRes.ok || !fiskilEndUserId) {
      console.error("End user create error", { status: endUserRes.status, body: endUserJson });
      return json(res, 500, {
        error: "Failed to create Fiskil end user",
        status: endUserRes.status,
        endUserJson,
      });
    }

    // -------- STEP 3: create auth session --------
    const sessionBody = {
      end_user_id: fiskilEndUserId,
      redirect_uri,
      cancel_uri,
    };

    const tryCreateSession = async (path) => {
      console.log("Checkpoint C: creating auth session", { path, ...sessionBody });
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fiskilToken}`,
        },
        body: JSON.stringify(sessionBody),
      });
      const body = await safeJson(response);
      if (!response.ok) console.error("Auth session error", { status: response.status, body });
      console.log("Checkpoint D: auth/session response", { status: response.status });
      return { response, body };
    };

    let sessionRes;
    let sessionJson;

    // Try versioned endpoint first, then fallback
    ({ response: sessionRes, body: sessionJson } = await tryCreateSession(`${base}/v1/auth/session`));
    if (sessionRes.status === 404) {
      ({ response: sessionRes, body: sessionJson } = await tryCreateSession(`${base}/auth/session`));
    }

    if (!sessionRes.ok) {
      return json(res, 500, {
        error: "Fiskil auth session failed",
        status: sessionRes.status,
        sessionJson,
      });
    }

    if (!sessionJson?.auth_url) {
      return json(res, 500, {
        error: "Fiskil auth session missing auth_url",
        sessionJson,
      });
    }

    return json(res, 200, {
      auth_url: sessionJson.auth_url,
      session_id: sessionJson.session_id,
      expires_at: sessionJson.expires_at,
      end_user_id: fiskilEndUserId,
    });
  } catch (err) {
    console.error("Unhandled:", err);
    return json(res, 500, { error: err?.message || "Internal Server Error" });
  }
};
