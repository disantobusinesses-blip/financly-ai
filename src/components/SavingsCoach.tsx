import { useMemo } from "react";
import { Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import Card from "./Card";
import { TargetIcon, TrendingUpIcon } from "./icon/Icon";

interface SavingsCoachProps {
  transactions: Transaction[];
}

interface Opportunity {
  category: string;
  current: number;
  recommendation: string;
}

const defaultChallenges = [
  "No-spend weekend on dining and rideshare",
  "Swap two premium subscriptions for ad-supported tiers",
  "Automate a mid-month top-up to your highest yield account",
];

export default function SavingsCoach({ transactions }: SavingsCoachProps) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const { opportunities, potentialMonthlySavings } = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    transactions.forEach((txn) => {
      if (txn.amount < 0) {
        const category = txn.category || "General Spending";
        categoryTotals[category] =
          (categoryTotals[category] || 0) + Math.abs(txn.amount);
      }
    });

    const sorted = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const opportunities: Opportunity[] = sorted.map(({ category, total }) => {
      const reductionTarget = total * 0.15;
      const recommendation = `Trim ${category.toLowerCase()} by ${formatCurrency(
        reductionTarget,
        region
      )} with smarter swaps and spending caps.`;

      return {
        category,
        current: total,
        recommendation,
      };
    });

    const potentialMonthlySavings = opportunities.reduce(
      (sum, item) => sum + item.current * 0.15,
      0
    );

    return { opportunities, potentialMonthlySavings };
  }, [transactions, region]);

  return (
    <Card
      title="Savings coach"
      subtitle="Instant challenges to free up cash for goals without feeling the pinch."
      icon={<TargetIcon className="h-6 w-6" />}
      insights={[
        {
          label: "Potential freed",
          value: formatCurrency(potentialMonthlySavings || 0, region),
          tone: potentialMonthlySavings > 0 ? "positive" : "neutral",
        },
        {
          label: "Focus areas",
          value: String(opportunities.length),
        },
        {
          label: "Region",
          value: region,
        },
      ]}
    >
      <div className="space-y-4 text-sm text-white/80">
        {opportunities.length > 0 ? (
          <ul className="space-y-3">
            {opportunities.map((opp) => (
              <li
                key={opp.category}
                className="rounded-xl bg-white/5 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {opp.category}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-white/60">
                      Current spend {formatCurrency(opp.current, region)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                    <TrendingUpIcon className="h-4 w-4" />
                    Save 15%
                  </span>
                </div>
                <p className="mt-3 text-white/75">{opp.recommendation}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/70">
            Add more transactions to identify tailored savings opportunities.
          </p>
        )}

        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-xs uppercase tracking-wide text-white/60">
            Weekly challenge ideas
          </p>
          <ul className="mt-2 space-y-2 text-white/80">
            {defaultChallenges.map((challenge) => (
              <li key={challenge} className="leading-snug">
                • {challenge}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
