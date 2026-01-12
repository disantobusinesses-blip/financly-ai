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

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toV1 = (base) => {
  const b = normalizeBase(base);
  return /\/v1$/i.test(b) ? b : `${b}/v1`;
};

const FISKIL_V1_BASE = toV1(FISKIL_BASE_URL);

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

  const r = await fetch(`${FISKIL_V1_BASE}/token`, {
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
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!r.ok) throw new Error(`Fiskil token failed (${r.status}): ${text}`);

  const token = data?.token;
  const expiresIn = Number(data?.expires_in ?? 600);
  if (!token) throw new Error(`Fiskil token missing in response: ${text}`);

  cachedToken = token;
  cachedTokenExpMs = now + expiresIn * 1000;
  return cachedToken;
}

async function fiskilRequest(path, options = {}) {
  const token = await getFiskilToken();
  const url = `${FISKIL_V1_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const r = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json; charset=UTF-8",
      authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await r.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!r.ok) {
    throw new Error(`Fiskil ${options.method || "GET"} ${path} failed (${r.status}): ${text}`);
  }

  return json;
}

function getOrigin(req) {
  const xfProto = req.headers["x-forwarded-proto"];
  const xfHost = req.headers["x-forwarded-host"];
  const host = xfHost || req.headers.host;
  const proto = xfProto || "https";
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1) Verify Supabase session
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing Authorization header" });

    const { data: userResp, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userResp?.user) return res.status(401).json({ error: "Invalid session" });

    const appUserId = userResp.user.id;
    const email = userResp.user.email || null;

    // 2) Get (or create) Fiskil end user
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("fiskil_user_id, has_bank_connection")
      .eq("id", appUserId)
      .maybeSingle();

    if (profileErr) throw profileErr;

    let endUserId = profile?.fiskil_user_id || null;

    if (!endUserId) {
      // Create end user in Fiskil (docs: POST /v1/end-users) :contentReference[oaicite:1]{index=1}
      const created = await fiskilRequest("/end-users", {
        method: "POST",
        body: JSON.stringify({
          email: email || `user_${appUserId}@example.com`,
          external_id: appUserId,
        }),
      });

      endUserId = created?.end_user_id || created?.id || created?.endUserId || null;
      if (!endUserId) throw new Error("Fiskil end user id missing from create end-user response");

      await supabaseAdmin
        .from("profiles")
        .update({ fiskil_user_id: endUserId })
        .eq("id", appUserId);
    }

    // 3) Create auth session (redirect flow)
    const origin = getOrigin(req);
    const redirect_uri = `${origin}/onboarding?end_user_id=${encodeURIComponent(endUserId)}`;
    const cancel_uri = `${origin}/onboarding`;

    // Fiskil docs reference creating an auth session via /auth/session :contentReference[oaicite:2]{index=2}
    const sessionJson = await fiskilRequest("/auth/session", {
      method: "POST",
      body: JSON.stringify({
        end_user_id: endUserId,
        redirect_uri,
        cancel_uri,
      }),
    });

    const authUrl =
      sessionJson?.auth_url ||
      sessionJson?.url ||
      sessionJson?.redirect_url ||
      sessionJson?.link ||
      null;

    if (!authUrl) {
      return res.status(500).json({
        error: "Missing auth_url from Fiskil auth session response",
        raw: sessionJson,
      });
    }

    return res.status(200).json({
      auth_url: authUrl,
      end_user_id: endUserId,
      redirect_uri,
    });
  } catch (e) {
    return res.status(500).json({
      error: "create-consent-session failed",
      details: String(e?.message || e),
    });
  }
}
