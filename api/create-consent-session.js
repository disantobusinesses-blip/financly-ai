import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FISKIL_BASE_URL = process.env.FISKIL_BASE_URL || "https://api.fiskil.com";
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

function mustEnv(name, value) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function normalizeBase(url) {
  return String(url || "").replace(/\/$/, "");
}
function toV1(base) {
  const b = normalizeBase(base || "https://api.fiskil.com");
  return /\/v1$/i.test(b) ? b : `${b}/v1`;
}

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!host) return "https://www.financlyai.com";
  return `${proto ? String(proto) : "https"}://${String(host)}`;
}

function getBearerToken(req) {
  const h = req.headers?.authorization;
  if (!h) return null;
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

const supabaseAdmin = (() => {
  mustEnv("SUPABASE_URL", SUPABASE_URL);
  mustEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
})();

let cachedToken = null;
let cachedTokenExpMs = 0;

async function getFiskilToken() {
  mustEnv("FISKIL_CLIENT_ID", FISKIL_CLIENT_ID);
  mustEnv("FISKIL_CLIENT_SECRET", FISKIL_CLIENT_SECRET);

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpMs - 15_000) return cachedToken;

  const v1 = toV1(FISKIL_BASE_URL);

  // IMPORTANT: Fiskil token endpoint is /v1/token (NOT /oauth/token)
  const r = await fetch(`${v1}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!r.ok) throw new Error(`Fiskil token failed (${r.status}): ${text}`);

  const token = data?.token || data?.access_token;
  const expiresIn = Number(data?.expires_in ?? 900);

  if (!token) throw new Error(`Fiskil token missing in response: ${text}`);

  cachedToken = token;
  cachedTokenExpMs = now + expiresIn * 1000;
  return cachedToken;
}

async function fiskilRequest(path, init) {
  const v1 = toV1(FISKIL_BASE_URL);
  const token = await getFiskilToken();

  const r = await fetch(`${v1}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });

  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!r.ok) {
    throw new Error(`Fiskil ${init?.method || "GET"} ${path} failed (${r.status}): ${text}`);
  }

  return data;
}

async function ensureEndUserId({ userId, email }) {
  // 1) If profile already has fiskil_user_id, use it
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("fiskil_user_id")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) throw new Error(profErr.message);
  if (profile?.fiskil_user_id) return profile.fiskil_user_id;

  // 2) Otherwise create end user in Fiskil (endpoint name can vary by account; try common variants)
  let created = null;
  const payload = {
    external_id: userId,
    email: email || undefined,
  };

  const candidates = ["/end-users", "/end_users", "/end-user", "/end_user"];
  let lastErr = null;

  for (const p of candidates) {
    try {
      created = await fiskilRequest(p, { method: "POST", body: JSON.stringify(payload) });
      if (created) break;
    } catch (e) {
      lastErr = e;
    }
  }

  if (!created) throw lastErr || new Error("Unable to create Fiskil end user");

  const endUserId =
    created?.end_user_id ||
    created?.id ||
    created?.endUserId ||
    created?.end_user?.id ||
    null;

  if (!endUserId) {
    throw new Error(`Fiskil end user create response missing id: ${JSON.stringify(created)}`);
  }

  // store it
  const { error: updErr } = await supabaseAdmin
    .from("profiles")
    .update({
      fiskil_user_id: endUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updErr) throw new Error(updErr.message);

  return endUserId;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method Not Allowed" });

  try {
    const jwt = getBearerToken(req);
    if (!jwt) return sendJson(res, 401, { error: "Missing auth" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) return sendJson(res, 401, { error: "Invalid auth" });

    const userId = userData.user.id;
    const email = userData.user.email || req.body?.email || null;

    const origin = getOrigin(req);
    const redirect_uri = `${origin}/fiskil/callback`;
    const cancel_uri = `${origin}/onboarding`;

    const endUserId = await ensureEndUserId({ userId, email });

    // Create auth session (Fiskil Link / Redirect flow)
    const session = await fiskilRequest("/auth/session", {
      method: "POST",
      body: JSON.stringify({
        end_user_id: endUserId,
        redirect_uri,
        cancel_uri,
      }),
    });

    const authUrl = session?.auth_url || session?.url || session?.link || null;
    if (!authUrl) {
      throw new Error(`Missing auth_url from Fiskil auth session: ${JSON.stringify(session)}`);
    }

    return sendJson(res, 200, {
      end_user_id: endUserId,
      auth_url: authUrl,
      redirect_uri,
      cancel_uri,
    });
  } catch (err) {
    console.error("create-consent-session error:", err);
    return sendJson(res, 500, { error: "create-consent-session failed", details: String(err?.message || err) });
  }
}
