import React, { useMemo } from "react";
import { Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import { BUDGET_CATEGORIES, summariseMonthlyBudget } from "../utils/spending";

interface SpendingGuidanceProps {
  transactions: Transaction[];
  region: User["region"];
}

const CATEGORY_MESSAGES: Record<(typeof BUDGET_CATEGORIES)[number], string> = {
  Essentials: "Aim to devote half of your take-home pay to housing, loans, utilities, groceries, fuel, and insurance.",
  Lifestyle: "Enjoy up to 30% on dining, entertainment, shopping, streaming, travel, and other nice-to-haves.",
  Savings: "Direct the remaining 20% toward savings, investments, super top-ups, and your emergency fund.",
};

const SpendingGuidance: React.FC<SpendingGuidanceProps> = ({ transactions, region }) => {
  const summary = useMemo(() => summariseMonthlyBudget(transactions), [transactions]);

  const hasIncome = summary.income > 0;

  return (
    <section
      className="futuristic-card hover-zoom rounded-3xl p-6 text-white"
      data-tour-id="spending-guidance"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-light">How you should spend</p>
          <h2 className="mt-2 text-2xl font-bold">Align next month with the 50/30/20 rule</h2>
          <p className="mt-1 text-sm text-white/70">
            We review the last 30 days of transactions, classify each keyword, and compare the ideal budget split to your
            actual habits.
          </p>
        </div>
        <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white/80 shadow-inner">
          Total monthly income: {formatCurrency(summary.income, region)}
        </div>
      </div>

      {!hasIncome ? (
        <p className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
          Connect your income streams to see how your budget lines up with the 50/30/20 recommendation.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {BUDGET_CATEGORIES.map((category) => {
            const actualAmount = summary.totals[category];
            const actualPercent = summary.percentages[category];
            const targetPercent = summary.targetPercentages[category];
            const targetAmount = summary.targetAmounts[category];
            const deltaPercent = summary.adjustments[category];
            const deltaAmount = (deltaPercent / 100) * summary.income;
            const aboveTarget = deltaPercent > 0.5;
            const belowTarget = deltaPercent < -0.5;

            return (
              <div key={category} className="flex flex-col gap-4 rounded-2xl bg-white/5 p-5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{category}</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatCurrency(actualAmount, region)} <span className="text-sm text-white/60">({actualPercent.toFixed(1)}%)</span>
                    </p>
                    <p className="mt-1 text-xs text-white/60">{CATEGORY_MESSAGES[category]}</p>
                  </div>
                  <div className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/70 shadow">
                    Target {targetPercent}%
                  </div>
                </div>
                <div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${
                        category === "Savings"
                          ? "bg-emerald-400"
                          : category === "Lifestyle"
                          ? "bg-secondary"
                          : "bg-primary-light"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, actualPercent))}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                    <span>Target {formatCurrency(targetAmount, region)}</span>
                    <span>{deltaPercent >= 0 ? "+" : ""}{deltaPercent.toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-sm text-white/70">
                  {aboveTarget &&
                    `Trim about ${formatCurrency(Math.abs(deltaAmount), region)} from ${category.toLowerCase()} to hit the 50/30/20 goal.`}
                  {belowTarget &&
                    `You’re ${formatCurrency(Math.abs(deltaAmount), region)} under the target. Allocate more towards ${category.toLowerCase()}.`}
                  {!aboveTarget && !belowTarget && "You’re right on track with this category."}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SpendingGuidance;

