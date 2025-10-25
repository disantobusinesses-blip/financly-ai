import { useMemo } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import Card from "./Card";
import { Transaction } from "../types";
import { BUDGET_CATEGORIES, summariseMonthlyBudget } from "../utils/spending";

interface SpendingChartProps {
  transactions: Transaction[];
}

const SpendingChart = ({ transactions }: SpendingChartProps) => {
  const summary = useMemo(() => summariseMonthlyBudget(transactions), [transactions]);

  const radarData = useMemo(
    () =>
      BUDGET_CATEGORIES.map((category) => ({
        category,
        actual: Number(summary.percentages[category].toFixed(1)),
        target: summary.targetPercentages[category],
      })),
    [summary]
  );

  const hasIncome = summary.income > 0;

  return (
    <Card title="50/30/20 radar">
      {!hasIncome ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Income activity required to chart your 50/30/20 mix.
        </p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="80%">
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Radar name="Actual" dataKey="actual" stroke="#4F46E5" fill="#6366F1" fillOpacity={0.35} />
              <Radar name="Target" dataKey="target" stroke="#CBD5F5" fill="#CBD5F5" fillOpacity={0.25} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default SpendingChart;

