import Stripe from 'stripe';
import {
  findReferralByReferredUser,
  getProfile,
  markReferralStatus,
  upsertProfile,
} from './_lib/referralStore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    const email = session.customer_details?.email || session.customer_email;
    console.log(`✅ Payment successful for user: ${userId}`);

    if (userId && email) {
      await upsertProfile({
        userId,
        email,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      });
    }

    if (userId) {
      const referral = await findReferralByReferredUser(userId);
      if (referral) {
        if (referral.status !== 'converted' && referral.status !== 'rewarded') {
          await markReferralStatus(referral.id, 'converted', { stripeCheckoutId: session.id });
        }

        if (referral.status !== 'rewarded') {
          try {
            const referrerProfile = referral.referrerId ? await getProfile(referral.referrerId) : null;
            const coupon = await stripe.coupons.create({
              percent_off: 50,
              duration: 'repeating',
              duration_in_months: 3,
              name: `MyAiBank referral reward ${referral.referrerId}`,
            });

            if (referrerProfile?.stripeSubscriptionId) {
              await stripe.subscriptions.update(referrerProfile.stripeSubscriptionId, {
                coupon: coupon.id,
              });
              await markReferralStatus(referral.id, 'rewarded', {
                rewardCouponId: coupon.id,
                rewardedAt: new Date().toISOString(),
              });
            } else {
              const promo = await stripe.promotionCodes.create({
                coupon: coupon.id,
                max_redemptions: 1,
                metadata: {
                  referrerId: referral.referrerId,
                },
              });
              await markReferralStatus(referral.id, 'rewarded', {
                rewardCouponId: coupon.id,
                rewardPromotionCode: promo.code,
                rewardedAt: new Date().toISOString(),
              });
            }
          } catch (rewardError) {
            console.error('❌ Failed to grant referral reward', rewardError);
          }
        }
      }
    }
  }

  res.json({ received: true });
}

// Needed so Vercel doesn’t parse body before Stripe validation
export const config = {
  api: {
    bodyParser: false,
  },
};
