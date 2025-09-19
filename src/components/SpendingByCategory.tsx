import { useMemo } from "react";
import { Transaction } from "../types";
import Card from "./Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SpendingByCategoryProps {
  transactions: Transaction[];
}

export default function SpendingByCategory({ transactions }: SpendingByCategoryProps) {
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach((txn) => {
      if (txn.amount < 0) {
        const category = txn.category || "Uncategorized";
        totals[category] = (totals[category] || 0) + Math.abs(txn.amount);
      }
    });

    return Object.entries(totals).map(([category, total]) => ({
      category,
      total,
    }));
  }, [transactions]);

  return (
    <Card title="Spending by Category">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="category" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
