import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Transaction } from "../types";
import Card from "./Card";
import { BUDGET_CATEGORIES, summariseMonthlyBudget } from "../utils/spending";

interface SpendingByCategoryProps {
  transactions: Transaction[];
}

const SpendingByCategory = ({ transactions }: SpendingByCategoryProps) => {
  const summary = useMemo(() => summariseMonthlyBudget(transactions), [transactions]);

  const chartData = useMemo(
    () =>
      BUDGET_CATEGORIES.map((category) => ({
        category,
        actual: Number(summary.totals[category].toFixed(2)),
        target: Number(summary.targetAmounts[category].toFixed(2)),
      })),
    [summary]
  );

  const hasIncome = summary.income > 0;

  return (
    <Card title="Spending split vs goal">
      {!hasIncome ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Add income transactions to unlock category comparisons.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
                <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} labelClassName="font-semibold" />
                <Legend />
                <Bar dataKey="actual" name="Actual" fill="#6366F1" radius={[0, 6, 6, 0]} />
                <Bar dataKey="target" name="Target" fill="#CBD5F5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-3 text-sm text-slate-600">
            {BUDGET_CATEGORIES.map((category) => {
              const actualPct = summary.percentages[category];
              const targetPct = summary.targetPercentages[category];
              const delta = summary.adjustments[category];
              const direction = delta > 0.5 ? "above" : delta < -0.5 ? "below" : "on";

              return (
                <li key={category} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{category}</p>
                    <p className="text-xs text-slate-500">
                      {actualPct.toFixed(1)}% of income vs {targetPct}% target
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {direction === "on"
                      ? "On track"
                      : `${direction === "above" ? "Reduce" : "Increase"} by ${Math.abs(delta).toFixed(1)}%`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default SpendingByCategory;
