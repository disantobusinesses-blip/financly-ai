import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log("🔍 Incoming request to /api/create-checkout-session");

  if (req.method !== "POST") {
    console.log("❌ Wrong method:", req.method);
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { userId, userEmail, region } = req.body || {};
    console.log("🔍 Request body:", { userId, userEmail, region });

    console.log("🔍 ENV CHECK:", {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
        ? "set (length " + process.env.STRIPE_SECRET_KEY.length + ")"
        : "MISSING",
      STRIPE_PRICE_ID_USD: process.env.STRIPE_PRICE_ID_USD || "MISSING",
      STRIPE_PRICE_ID_AUD: process.env.STRIPE_PRICE_ID_AUD || "MISSING",
      FRONTEND_URL: process.env.FRONTEND_URL || "MISSING",
    });

    if (!userId || !userEmail || !region) {
      return res.status(400).json({
        error: { message: "User ID, email, and region are required." },
      });
    }

    const priceId =
      region === "US"
        ? process.env.STRIPE_PRICE_ID_USD
        : process.env.STRIPE_PRICE_ID_AUD;

    if (!priceId) {
      return res.status(400).json({
        error: { message: `Pricing not configured for region: ${region}` },
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      client_reference_id: userId,
      customer_email: userEmail,
      success_url: `${process.env.FRONTEND_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}?payment=cancelled`,
    });

    console.log("✅ Created Stripe session:", session.id);

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(500).json({ error: { message: err.message } });
  }
}
