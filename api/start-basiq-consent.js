import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = "https://au-api.basiq.io";

let CACHED_SERVER_TOKEN = null;
let SERVER_TOKEN_EXPIRY = 0;

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wyommhasmvdhqxwehhel.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizedBasicKey() {
  if (!BASIQ_API_KEY) throw new Error("Missing BASIQ_API_KEY env var");
  const raw = BASIQ_API_KEY.trim();
  return raw.startsWith("Basic ") ? raw : `Basic ${raw}`;
}

async function getServerToken() {
  const now = Date.now();
  if (CACHED_SERVER_TOKEN && now < SERVER_TOKEN_EXPIRY) return CACHED_SERVER_TOKEN;

  const res = await fetch(`${BASIQ_API_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: normalizedBasicKey(),
      "Content-Type": "application/x-www-form-urlencoded",
      "basiq-version": "3.0",
    },
    body: new URLSearchParams({ scope: "SERVER_ACCESS" }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to get server token: ${t}`);
  }
  const { access_token } = await res.json();
  CACHED_SERVER_TOKEN = access_token;
  SERVER_TOKEN_EXPIRY = now + 55 * 60 * 1000;
  return CACHED_SERVER_TOKEN;
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
    if (!token) return res.status(401).json({ error: "not authenticated" });

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) return res.status(401).json({ error: "not authenticated" });

    const userId = authData.user.id;
    const email = authData.user.email || req.body?.email;
    if (!email) return res.status(400).json({ error: "missing email" });

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profileData) {
      const { error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, email }, { onConflict: "id" })
        .select()
        .single();
      if (upsertError) throw upsertError;
    }

    const SERVER_TOKEN = await getServerToken();

    let basiqUserId;
    const createRes = await fetch(`${BASIQ_API_URL}/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        "Content-Type": "application/json",
        "basiq-version": "3.0",
      },
      body: JSON.stringify({ email }),
    });

    if (createRes.status === 201) {
      const user = await createRes.json();
      basiqUserId = user.id;
    } else if (createRes.status === 409) {
      const lookup = await fetch(`${BASIQ_API_URL}/users?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${SERVER_TOKEN}`, "basiq-version": "3.0" },
      });
      if (!lookup.ok) throw new Error(`User conflict but lookup failed: ${await lookup.text()}`);
      const { data } = await lookup.json();
      basiqUserId = data?.[0]?.id;
      if (!basiqUserId) throw new Error("User exists but could not be fetched");
    } else {
      throw new Error(`Create user failed: ${await createRes.text()}`);
    }

    const clientTok = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: normalizedBasicKey(),
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: new URLSearchParams({ scope: "CLIENT_ACCESS", userId: basiqUserId }),
    });
    if (!clientTok.ok) throw new Error(`Failed to get client token: ${await clientTok.text()}`);
    const { access_token: CLIENT_TOKEN } = await clientTok.json();
    const consentUrl = `https://consent.basiq.io/home?token=${CLIENT_TOKEN}&action=connect`;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email, basiq_user_id: basiqUserId, has_bank_connection: true }, { onConflict: "id" })
      .select()
      .single();

    return res.status(200).json({ consentUrl, userId: basiqUserId });
  } catch (err) {
    console.error("❌ /api/start-basiq-consent error:", err);
    return res.status(500).json({ error: "Unable to start bank connection" });
  }
}
