import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toFiskilV1Base = (base) => {
  const resolved = normalizeBase(base || "https://api.fiskil.com");
  return /\/v1$/i.test(resolved) ? resolved : `${resolved}/v1`;
};

const FISKIL_BASE_URL = toFiskilV1Base(process.env.FISKIL_BASE_URL);
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!host) return "https://www.financlyai.com";
  return `${proto ? String(proto) : "https"}://${String(host)}`;
}

async function getFiskilAccessToken() {
  const r = await fetch(`${FISKIL_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Fiskil token error: ${text || r.status}`);
  }

  const data = await r.json();
  if (!data?.access_token) throw new Error("Fiskil token missing access_token");
  return data.access_token;
}

async function fiskilPost(path, token, payload) {
  const url = `${FISKIL_BASE_URL}${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!r.ok) {
    throw new Error(
      `Fiskil POST ${path} failed: ${typeof json?.error === "string" ? json.error : text || r.status}`
    );
  }

  return json;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return sendJson(res, 500, { error: "Missing Supabase env vars" });
    }

    if (!FISKIL_BASE_URL || !FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
      return sendJson(res, 500, { error: "Missing Fiskil env vars" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return sendJson(res, 401, { error: "Missing Authorization header" });
    }

    const jwt = authHeader.slice("Bearer ".length);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate Supabase user from JWT
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return sendJson(res, 401, { error: "Invalid session" });
    }

    const appUserId = userData.user.id;

    // Load profile + existing end user id if present
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("fiskil_user_id")
      .eq("id", appUserId)
      .maybeSingle();

    if (profileErr) {
      return sendJson(res, 500, { error: profileErr.message });
    }

    // Ensure we have an end_user_id.
    // If you already create this elsewhere, this will just reuse it.
    let endUserId = profile?.fiskil_user_id || null;

    // If your system creates Fiskil end users elsewhere, remove this block.
    // Otherwise: create a Fiskil end user when missing.
    if (!endUserId) {
      const fiskilToken = await getFiskilAccessToken();

      // Fiskil uses the concept of an end user (varies by implementation).
      // We generate a stable external reference using the Supabase user id.
      // If your Fiskil project expects different fields, adjust payload accordingly.
      const created = await fiskilPost("/end_users", fiskilToken, {
        external_id: appUserId,
      });

      // Some APIs return { id: "eu_..." }, others { data: { id } }
      endUserId = created?.id || created?.data?.id || null;

      if (!endUserId) {
        return sendJson(res, 500, { error: "Failed to create Fiskil end user" });
      }

      const { error: upErr } = await supabase
        .from("profiles")
        .update({ fiskil_user_id: endUserId })
        .eq("id", appUserId);

      if (upErr) {
        return sendJson(res, 500, { error: upErr.message });
      }
    }

    const origin = getOrigin(req);

    // Redirect flow: send user back to the callback that will mark bank connected.
    const redirect_uri = `${origin}/fiskil/callback`;
    const cancel_uri = `${origin}/onboarding`;

    // Create Fiskil auth session → returns auth_url (per Fiskil quick start)
    // Docs show creating an Auth Session which returns auth_url. :contentReference[oaicite:1]{index=1}
    const fiskilToken = await getFiskilAccessToken();
    const sessionPayload = await fiskilPost("/auth/session", fiskilToken, {
      end_user_id: endUserId,
      redirect_uri,
      cancel_uri,
    });

    const auth_url = sessionPayload?.auth_url || sessionPayload?.data?.auth_url;

    if (!auth_url) {
      return sendJson(res, 500, {
        error: "Missing auth_url from Fiskil auth session response",
        debug: { endUserId, keys: Object.keys(sessionPayload || {}) },
      });
    }

    return sendJson(res, 200, {
      auth_url,
      end_user_id: endUserId,
    });
  } catch (err) {
    console.error("create-consent-session error:", err);
    return sendJson(res, 500, { error: err?.message || "Unknown server error" });
  }
}
