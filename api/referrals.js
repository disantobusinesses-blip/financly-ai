import { createOrGetReferral, listReferralsByReferrer, markReferralStatus } from "./_lib/referralStore";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { referrerId } = req.query;
    if (!referrerId) {
      return res.status(400).json({ error: { message: "referrerId is required" } });
    }
    const referrals = await listReferralsByReferrer(String(referrerId));
    return res.status(200).json({ referrals });
  }

  if (req.method === "POST") {
    const { referrerId, referredEmail, referredUserId } = req.body || {};
    if (!referrerId || !referredEmail || !referredUserId) {
      return res.status(400).json({ error: { message: "referrerId, referredEmail, and referredUserId are required" } });
    }
    const referral = await createOrGetReferral({ referrerId, referredEmail, referredUserId });
    return res.status(200).json({ referral });
  }

  if (req.method === "PATCH") {
    const { id, status, extra } = req.body || {};
    if (!id || !status) {
      return res.status(400).json({ error: { message: "id and status are required" } });
    }
    const updated = await markReferralStatus(id, status, extra || {});
    if (!updated) {
      return res.status(404).json({ error: { message: "Referral not found" } });
    }
    return res.status(200).json({ referral: updated });
  }

  return res.status(405).json({ error: { message: "Method not allowed" } });
}

