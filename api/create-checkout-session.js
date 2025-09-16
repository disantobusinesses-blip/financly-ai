import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { userId, userEmail, region } = req.body;

    if (!userId || !userEmail || !region) {
      return res.status(400).json({
        error: { message: "User ID, email, and region are required." }
      });
    }

    const priceId =
      region === 'US'
        ? process.env.STRIPE_PRICE_ID_USD
        : process.env.STRIPE_PRICE_ID_AUD;

    if (!priceId) {
      return res.status(400).json({
        error: { message: `Pricing not configured for region: ${region}` }
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      client_reference_id: userId,
      customer_email: userEmail,
      success_url: `${process.env.frontend_url}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.frontend_url}?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Error creating Stripe checkout session:', err.message);
    res.status(500).json({ error: { message: err.message } });
  }
}
