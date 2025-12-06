import { createClient } from "@supabase/supabase-js";
import { createFiskilCustomer, createFiskilLinkSession } from "../src/lib/fiskilClient";

const FISKIL_API_KEY = process.env.FISKIL_API_KEY || process.env.FISKIL_SECRET_KEY;
const FISKIL_API_URL = process.env.FISKIL_API_URL || "https://api.fiskil.com/v2";

const CACHED_CUSTOMER_LOOKUP = new Map();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wyommhasmvdhqxwehhel.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createSupabaseServerClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  if (!FISKIL_API_KEY || !FISKIL_API_URL) {
    console.error("start-fiskil-link error: missing Fiskil configuration", {
      hasApiKey: Boolean(FISKIL_API_KEY),
      hasApiUrl: Boolean(FISKIL_API_URL),
    });
    return res.status(500).json({ error: "Fiskil configuration missing on server" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const supabaseAuth = createSupabaseServerClient(token);
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !authData?.user) return res.status(401).json({ error: "Not authenticated" });

    const userId = authData.user.id;
    const email = authData.user.email || req.body?.email;
    if (!email) return res.status(400).json({ error: "missing email" });

    const { data: profileData, error: profileError } = await supabaseAuth
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profileData) {
      const { error: upsertError } = await supabaseAuth
        .from("profiles")
        .upsert({ id: userId, email }, { onConflict: "id" })
        .select()
        .single();
      if (upsertError) throw upsertError;
    }

    let customerId = CACHED_CUSTOMER_LOOKUP.get(email);
    if (!customerId) {
      const customer = await createFiskilCustomer(email);
      customerId = customer.id;
      CACHED_CUSTOMER_LOOKUP.set(email, customerId);
    }

    const host = req.headers.origin || process.env.SITE_URL || process.env.VERCEL_URL || "";
    const redirectBase = host.startsWith("http") ? host : `https://${host}`;
    const redirectUrl = `${redirectBase}/fiskil/callback`;

    const session = await createFiskilLinkSession(customerId, redirectUrl);

    await supabaseAuth
      .from("profiles")
      .upsert({
        id: userId,
        email,
        fiskil_customer_id: customerId,
        has_bank_connection: false,
      })
      .select()
      .single();

    return res.status(200).json({ linkUrl: session.url, customerId, linkToken: session.token });
  } catch (err) {
    console.error("start-fiskil-link error", err);
    const detail = err?.message;
    return res.status(500).json({ error: "Unable to start bank connection", detail });
  }
}
