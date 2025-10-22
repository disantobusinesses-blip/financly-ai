import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Card from "./Card";
import { Transaction } from "../types";

interface SpendingChartProps {
  transactions: Transaction[];
}

const COLORS = ["#4F46E5", "#22C55E", "#EF4444", "#F59E0B", "#3B82F6", "#9333EA"];

export default function SpendingChart({ transactions }: SpendingChartProps) {
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const totals: Record<string, number> = {};

    transactions.forEach((txn) => {
      if (txn.amount < 0) {
        const category = txn.category || "Uncategorized";
        totals[category] = (totals[category] || 0) + Math.abs(txn.amount);
      }
    });

    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  return (
    <Card title="Spending by Category">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              label
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
