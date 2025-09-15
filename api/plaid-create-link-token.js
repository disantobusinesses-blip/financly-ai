export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // For now: mock Plaid link token
    const mockLinkToken = `link-sandbox-mock-token-for-${userId}`;

    res.json({ link_token: mockLinkToken });
  } catch (error) {
    console.error("❌ Error in /api/plaid-create-link-token:", error);
    res.status(500).json({ error: 'Failed to create Plaid link token.' });
  }
}
