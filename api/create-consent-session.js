import { createClient } from "@supabase/supabase-js";

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

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return json(res, 405, { error: "Method not allowed" });
    }

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
    if (!FRONTEND_URL) missing.push("FRONTEND_URL");

    if (missing.length) {
      return json(res, 500, { error: "Server misconfigured", missing });
    }

    const base = FISKIL_BASE_URL.replace(/\/$/, "");

    // -------- get user from Supabase --------
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return json(res, 401, { error: "Missing Authorization header" });
    }

    const accessToken = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);

    if (userErr || !userData?.user) {
      return json(res, 401, { error: "Invalid session" });
    }

    const user = userData.user;

    // -------- STEP 1: get Fiskil token --------
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

    const tokenJson = await safeJson(tokenRes);

    if (!tokenRes.ok || !tokenJson.token) {
      return json(res, 500, {
        error: "Failed to authenticate with Fiskil",
        status: tokenRes.status,
        tokenJson,
      });
    }

    const fiskilToken = tokenJson.token;

    // -------- STEP 2: create auth session --------
    const redirect_uri = "https://www.financlyai.com/onboarding";
    const cancel_uri = "https://www.financlyai.com/onboarding";

    console.log("Creating Fiskil auth session with:", {
      end_user_id: user.id,
      redirect_uri,
      cancel_uri,
      base,
    });

    let sessionRes;
    try {
      sessionRes = await fetch(`${base}/v1/auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fiskilToken}`,
        },
        body: JSON.stringify({
          end_user_id: user.id,
          redirect_uri,
          cancel_uri,
        }),
      });
    } catch (err) {
      console.error("Fiskil /v1/auth/session fetch failed:", err, "cause:", err?.cause);
      return json(res, 500, {
        error: "Fiskil /v1/auth/session fetch failed",
        cause: String(err?.cause || err),
      });
    }

    const sessionJson = await safeJson(sessionRes);

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
    });
  } catch (err) {
    console.error(err);
    return json(res, 500, { error: err?.message || "Internal Server Error" });
  }
}
