import fetch from "node-fetch";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wyommhasmvdhqxwehhel.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userResponse.ok) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const userData = await userResponse.json();
  const userId = userData?.user?.id;
  if (!userId) {
    return res.status(400).json({ error: "User not found" });
  }

  const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription_status: "active" }),
  });

  if (!updateResponse.ok) {
    const err = await updateResponse.json().catch(() => ({}));
    return res.status(500).json({ error: err?.message || "Failed to activate" });
  }

  return res.status(200).json({ success: true });
}
