import { upsertProfile } from "./_lib/referralStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const { userId, email, stripeCustomerId, stripeSubscriptionId } = req.body || {};
  if (!userId || !email) {
    return res.status(400).json({ error: { message: "userId and email are required" } });
  }

  const profile = await upsertProfile({
    userId,
    email,
    ...(stripeCustomerId ? { stripeCustomerId } : {}),
    ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
  });

  return res.status(200).json({ profile });
}

