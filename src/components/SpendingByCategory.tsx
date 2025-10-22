import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Transaction } from "../types";
import Card from "./Card";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

const COLORS = [
  "#4F46E5",
  "#2563EB",
  "#0EA5E9",
  "#22C55E",
  "#F97316",
  "#F59E0B",
  "#EC4899",
  "#9333EA",
  "#0EA5E9",
  "#14B8A6",
];

interface SpendingCategoryDatum {
  category: string;
  total: number;
  count: number;
  average: number;
  share: number;
}

export default function SpendingByCategory({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const data = useMemo<SpendingCategoryDatum[]>(() => {
    if (!transactions.length) return [];

    const totals = new Map<string, { total: number; count: number }>();

    transactions.forEach((txn) => {
      const amount = Number.isFinite(txn.amount) ? txn.amount : 0;
      if (amount >= 0) return;

      const category = txn.category?.trim() || "General";
      const current = totals.get(category) ?? { total: 0, count: 0 };
      current.total += Math.abs(amount);
      current.count += 1;
      totals.set(category, current);
    });

    const filtered: SpendingCategoryDatum[] = [];
    totals.forEach((value, category) => {
      if (value.total <= 0) return;
      filtered.push({
        category,
        total: value.total,
        count: value.count,
        average: value.total / value.count,
        share: 0,
      });
    });
    const totalSpent = filtered.reduce((sum, item) => sum + item.total, 0);

    return filtered
      .map((item) => ({ ...item, share: totalSpent > 0 ? item.total / totalSpent : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions]);

  const totalSpending = data.reduce((sum, item) => sum + item.total, 0);
  const topCategory = data[0];

  return (
    <Card
      title="Spending by category"
      subtitle="See where your dollars are flowing so you can cap the costliest habits."
      insights={[
        topCategory
          ? { label: "Top category", value: `${topCategory.category}` }
          : { label: "Top category", value: "-" },
        {
          label: "Tracked spend",
          value: formatCurrency(totalSpending, region),
          tone: totalSpending > 0 ? "negative" : "neutral",
        },
        {
          label: "Categories",
          value: String(data.length || 0),
        },
      ]}
    >
      {data.length === 0 ? (
        <p className="py-10 text-center text-base text-slate-500">
          No categorised transactions yet.
        </p>
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 12, right: 24, bottom: 12, left: 16 }}
            >
              <XAxis
                type="number"
                tickFormatter={(value) => formatCurrency(value, region)}
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 12, fill: "#0F172A" }}
                width={150}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "total") {
                    return [formatCurrency(value, region), "Spend"];
                  }
                  if (name === "average") {
                    return [formatCurrency(value, region), "Average"]; // not used but safe
                  }
                  return [value, name];
                }}
                labelFormatter={(label: string) => label}
                contentStyle={{
                  background: "#0F172A",
                  color: "#F8FAFC",
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                }}
              />
              <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={18}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.length > 0 && (
        <div className="mt-6 space-y-3 text-xs text-slate-500">
          {data.map((item) => (
            <div
              key={`${item.category}-meta`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2"
            >
              <span className="font-semibold text-slate-700">{item.category}</span>
              <div className="flex flex-wrap items-center gap-3">
                <span>{item.count} transaction{item.count === 1 ? "" : "s"}</span>
                <span>Avg {formatCurrency(item.average, region)}</span>
                <span>{(item.share * 100).toFixed(1)}% of spend</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
