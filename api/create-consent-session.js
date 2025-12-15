import { createClient } from "@supabase/supabase-js";

const DEFAULT_FISKIL_BASE_URL = "https://api.fiskil.com";

function normalizeBaseUrl(url) {
  return (url || DEFAULT_FISKIL_BASE_URL).replace(/\/+$/, "");
}

function buildFrontendBaseUrl(req) {
  const configuredBase = process.env.FRONTEND_URL?.trim();
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers.host || process.env.VERCEL_URL || "localhost";
  const derived = `${proto}://${host}`;
  const base = normalizeBaseUrl(configuredBase || derived);

  try {
    const parsed = new URL(base);
    if (parsed.protocol !== "https:") {
      parsed.protocol = "https:";
    }
    return parsed.origin;
  } catch (err) {
    console.warn("[create-consent-session] Unable to parse base URL, falling back to https://", err);
    return `https://${base.replace(/^https?:\/\//, "")}`.replace(/\/+$/, "");
  }
}

function validateEnv() {
  const required = [
    "FISKIL_CLIENT_ID",
    "FISKIL_CLIENT_SECRET",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]);
  return { missing, ok: missing.length === 0 };
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

async function fetchFiskilToken(baseUrl) {
  const url = `${baseUrl}/v1/token`;
  console.log(`[create-consent-session] Requesting Fiskil token: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.FISKIL_CLIENT_ID,
      client_secret: process.env.FISKIL_CLIENT_SECRET,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(
      `[create-consent-session] Fiskil token request failed: status ${response.status}`,
      parseJsonSafely(text) || text
    );
    throw new Error("Unable to obtain Fiskil access token");
  }

  const body = parseJsonSafely(text);
  console.log("[create-consent-session] Received Fiskil token response");
  if (!body || (!body.token && !body.access_token)) {
    throw new Error("Fiskil token response missing token");
  }
  return body.token || body.access_token;
}

async function createAuthSession(baseUrl, token, payload) {
  const endpoints = ["/v1/auth/session", "/auth/session"];
  for (const path of endpoints) {
    const url = `${baseUrl}${path}`;
    console.log(`[create-consent-session] Creating Fiskil auth session: ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (response.ok) {
      console.log("[create-consent-session] Auth session created successfully");
      return parseJsonSafely(text) || {};
    }

    const parsed = parseJsonSafely(text) || text;
    console.error(
      `[create-consent-session] Auth session request failed: status ${response.status}`,
      parsed
    );

    if (response.status === 404) {
      console.log("[create-consent-session] Received 404, trying fallback endpoint");
      continue;
    }

    throw new Error(
      typeof parsed === "string" ? parsed : parsed?.message || "Unable to create Fiskil auth session"
    );
  }

  throw new Error("Fiskil auth session endpoint not found");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { missing, ok } = validateEnv();
  if (!ok) {
    return res.status(500).json({ error: "Missing environment variables", missing });
  }

  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!accessToken) {
    return res.status(401).json({ error: "Authorization header with Bearer token is required" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: userError?.message || "Invalid or expired session" });
  }

  const userId = userData.user.id;
  const endUserId = userId;
  const baseUrl = normalizeBaseUrl(process.env.FISKIL_BASE_URL);
  const redirectBase = buildFrontendBaseUrl(req);
  const redirectUri = `${redirectBase}/onboarding`;
  const cancelUri = `${redirectBase}/onboarding`;

  try {
    const fiskilToken = await fetchFiskilToken(baseUrl);

    const authSession = await createAuthSession(baseUrl, fiskilToken, {
      end_user_id: endUserId,
      redirect_uri: redirectUri,
      cancel_uri: cancelUri,
    });

    const authUrl = authSession.auth_url || authSession.authUrl || authSession.url;
    if (!authUrl) {
      throw new Error("Fiskil auth session response missing auth_url");
    }

    return res.status(200).json({
      auth_url: authUrl,
      session_id: authSession.session_id,
      expires_at: authSession.expires_at,
    });
  } catch (err) {
    console.error("[create-consent-session] Error starting consent session", err);
    return res.status(500).json({
      error: err?.message || "Unable to start bank connection",
    });
  }
}
