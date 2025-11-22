import express from "express";
import Stripe from "stripe";

interface PlanResponse {
  id: string;
  name: string;
  interval: "month" | "year";
  currency: string;
  price: number;
}

const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;

const fallbackPlans: PlanResponse[] = [
  { id: "plan_monthly_fallback", name: "Monthly", interval: "month", currency: "AUD", price: 29 },
  { id: "plan_annual_fallback", name: "Annual", interval: "year", currency: "AUD", price: 299 },
];

export const router = express.Router();

router.get("/api/plans", async (_req, res) => {
  if (!stripeSecret) {
    res.json({ plans: fallbackPlans, source: "fallback" });
    return;
  }

  try {
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" });
    const prices = await stripe.prices.list({
      expand: ["data.product"],
      active: true,
      limit: 20,
    });

    const plans: PlanResponse[] = prices.data
      .filter((price) => price.type === "recurring" && (price.recurring?.interval === "month" || price.recurring?.interval === "year"))
      .map((price) => ({
        id: price.id,
        name: price.nickname || (price.recurring?.interval === "year" ? "Annual" : "Monthly"),
        interval: price.recurring?.interval as "month" | "year",
        currency: (price.currency || "aud").toUpperCase(),
        price: (price.unit_amount ?? 0) / 100,
      }));

    const monthlyPlan = plans.find((plan) => plan.interval === "month");
    const annualPlan = plans.find((plan) => plan.interval === "year");
    const orderedPlans = [monthlyPlan, annualPlan].filter(Boolean) as PlanResponse[];

    res.json({ plans: orderedPlans.length ? orderedPlans : plans, source: "stripe" });
  } catch (error) {
    console.error("Unable to fetch Stripe plans", error);
    res.json({ plans: fallbackPlans, source: "error-fallback" });
  }
});
