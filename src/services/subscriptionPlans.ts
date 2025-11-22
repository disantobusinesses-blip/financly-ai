export interface SubscriptionPlan {
  id: string;
  name: string;
  interval: "month" | "year";
  currency: string;
  price: number;
}

const fallbackPlans: SubscriptionPlan[] = [
  {
    id: "plan_monthly_fallback",
    name: "Monthly",
    interval: "month",
    currency: "AUD",
    price: 29,
  },
  {
    id: "plan_annual_fallback",
    name: "Annual",
    interval: "year",
    currency: "AUD",
    price: 299,
  },
];

export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const response = await fetch("/api/plans");
    if (!response.ok) {
      return fallbackPlans;
    }
    const data = await response.json();
    if (Array.isArray(data?.plans) && data.plans.length) {
      return data.plans as SubscriptionPlan[];
    }
    return fallbackPlans;
  } catch (error) {
    console.warn("Falling back to default plans", error);
    return fallbackPlans;
  }
};
