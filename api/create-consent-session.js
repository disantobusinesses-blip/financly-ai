import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toV1 = (base) => {
  const b = normalizeBase(base);
  return /\/v1$/i.test(b) ? b : `${b}/v1`;
};

// IMPORTANT:
// OAuth base must NOT be forced to /v1
const FISKIL_OAUTH_BASE = normalizeBase(process.env.FISKIL_OAUTH_BASE || "https://api.fiskil.com");
// API base SHOULD be /v1
const FISKIL_API_BASE = normalizeBase(process.env.FISKIL_API_BASE || toV1(process.env.FISKIL_OAUTH_BASE || "https://api.fiskil.com"));

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
  const r = await fetch(`${FISKIL_OAUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!r.ok) {
  
::contentReference[oaicite:0]{index=0}
