import { useMemo } from "react";
import { Transaction } from "../types";
import Card from "./Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

// Define a friendly color palette
const COLORS = [
  "#4F46E5", "#6366F1", "#818CF8", "#A5B4FC",
  "#C7D2FE", "#F59E0B", "#10B981", "#EF4444", "#3B82F6"
];

export default function SpendingByCategory({ transactions }: { transactions: Transaction[] }) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const data = useMemo(() => {
    const totals: Record<string, number> = {};

    transactions.forEach((txn) => {
      const category = txn.category || "General Spending";
      const amt = Math.abs(txn.amount || 0);

      if (txn.amount < 0 || category === "Fees & Charges") {
        totals[category] = (totals[category] || 0) + amt;
      }
    });

    const sorted = Object.entries(totals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    return sorted.slice(0, 10);
  }, [transactions]);

  const topCategory = data[0];
  const totalSpending = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card
      title="Spending by Category"
      subtitle="See where your dollars are flowing so you can cap the costliest habits."
      insights={[
        topCategory
          ? {
              label: "Top category",
              value: `${topCategory.category}`,
              tone: "neutral",
            }
          : { label: "Top category", value: "-" },
        {
          label: "Tracked spend",
          value: formatCurrency(totalSpending, region),
          tone: "negative",
        },
        {
          label: "Categories",
          value: String(data.length || 0),
        },
      ]}
    >
      <div className="h-96">
        {data.length === 0 ? (
          <p className="py-12 text-center text-base text-white/70">
            No categorized transactions yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="category"
                tick={{ fontSize: 12, fill: "#F8FAFC" }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 12, fill: "#E2E8F0" }} />
              <Tooltip
                formatter={(value: number) =>
                  typeof value === "number" ? formatCurrency(value, region) : value
                }
                labelFormatter={(label: string) => label}
                contentStyle={{
                  background: "rgba(30, 41, 59, 0.95)",
                  color: "#F8FAFC",
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
                }}
              />
              <Bar dataKey="total" radius={[10, 10, 4, 4]}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}