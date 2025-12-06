// Replacement for /api/create-consent-session.js using Fiskil Link
// Node 18+ (Vercel) uses native fetch.

import { createFiskilCustomer, createFiskilLinkSession } from "../src/lib/fiskilClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const email = req.body?.email?.toLowerCase()?.trim() || `user-${Date.now()}@example.com`;

    const { id } = await createFiskilCustomer(email);
    const host = req.headers.origin || process.env.SITE_URL || process.env.VERCEL_URL || "";
    const redirectBase = host.startsWith("http") ? host : `https://${host}`;
    const redirectUrl = `${redirectBase}/fiskil/callback`;
    const session = await createFiskilLinkSession(id, redirectUrl);

    return res.status(200).json({ consentUrl: session.url, userId: id, linkToken: session.token });
  } catch (err) {
    console.error("❌ /api/create-fiskil-link error:", err);
    return res.status(500).json({
      error: "Unable to start bank connection",
      details: String(err?.message || err),
    });
  }
}
