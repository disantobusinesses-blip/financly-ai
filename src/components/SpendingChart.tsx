import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Card from "./Card";
import { Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

interface SpendingChartProps {
  transactions: Transaction[];
}

const COLORS = ["#4F46E5", "#22C55E", "#EF4444", "#F59E0B", "#3B82F6", "#9333EA"];

export default function SpendingChart({ transactions }: SpendingChartProps) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const totals: Record<string, number> = {};

    transactions.forEach((txn) => {
      if (txn.amount < 0) {
        const category = txn.category || "Uncategorized";
        totals[category] = (totals[category] || 0) + Math.abs(txn.amount);
      }
    });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const largest = data[0];

  return (
    <Card
      title="Spending share"
      subtitle="Compare how each category contributes to your overall outgoing spend."
      insights={[
        largest
          ? { label: "Largest", value: largest.name, tone: "neutral" }
          : { label: "Largest", value: "-" },
        {
          label: "Total analysed",
          value: formatCurrency(total, region),
        },
        {
          label: "Categories",
          value: String(data.length),
        },
      ]}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(1)}%`
              }
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                typeof value === "number" ? formatCurrency(value, region) : value
              }
              contentStyle={{
                background: "rgba(15, 23, 42, 0.95)",
                color: "#F8FAFC",
                borderRadius: 12,
                border: "none",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
              }}
            />
            <Legend
              wrapperStyle={{
                color: "#E2E8F0",
                paddingTop: 20,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
