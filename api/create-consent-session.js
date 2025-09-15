import fetch from 'node-fetch';

const BASIQ_API_KEY = process.env.BASIQ_API_KEY;
const BASIQ_API_URL = 'https://au-api.basiq.io';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const email =
      (req.body && req.body.email)
        ? req.body.email.toLowerCase()
        : `user-${Date.now()}@example.com`;

    const authorizationHeader = `Basic ${BASIQ_API_KEY}`;

    // 1. Get server token
    const serverTokRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: 'POST',
      headers: {
        Authorization: authorizationHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'basiq-version': '3.0',
      },
      body: new URLSearchParams({ scope: 'SERVER_ACCESS' }),
    });
    if (!serverTokRes.ok) throw new Error(await serverTokRes.text());
    const { access_token: SERVER_TOKEN } = await serverTokRes.json();

    // 2. Create user
    const userRes = await fetch(`${BASIQ_API_URL}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVER_TOKEN}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0',
      },
      body: JSON.stringify({ email }),
    });
    if (!userRes.ok && userRes.status !== 409)
      throw new Error(await userRes.text());
    const user = await userRes.json();

    // 3. Get client token
    const clientTokRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: 'POST',
      headers: {
        Authorization: authorizationHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'basiq-version': '3.0',
      },
      body: new URLSearchParams({ scope: 'CLIENT_ACCESS', userId: user.id }),
    });
    if (!clientTokRes.ok) throw new Error(await clientTokRes.text());
    const { access_token: CLIENT_TOKEN } = await clientTokRes.json();

    const consentUrl = `https://consent.basiq.io/home?token=${CLIENT_TOKEN}&action=connect`;

    res.json({ consentUrl, userId: user.id });
  } catch (err) {
    console.error('❌ Error in /api/create-consent-session:', err);
    res.status(500).json({ error: String(err) });
  }
}
