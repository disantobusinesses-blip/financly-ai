import { useMemo } from "react";
import { Transaction } from "../types";
import Card from "./Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Define a friendly color palette
const COLORS = [
  "#4F46E5", "#6366F1", "#818CF8", "#A5B4FC",
  "#C7D2FE", "#F59E0B", "#10B981", "#EF4444", "#3B82F6"
];

// Heuristic category mapping (for better readability)
function mapCategory(txn: Transaction): string {
  if (!txn) return "Uncategorized";

  const raw =
    txn.category ||
    (txn as any)?.class?.category ||
    txn.description?.toLowerCase() ||
    "";

  if (raw.includes("salary") || raw.includes("payroll")) return "Income";
  if (raw.includes("coles") || raw.includes("woolworth")) return "Groceries";
  if (raw.includes("afterpay")) return "Debt / Buy Now Pay Later";
  if (raw.includes("rent") || raw.includes("mortgage")) return "Housing";
  if (raw.includes("uber") || raw.includes("fuel") || raw.includes("petrol"))
    return "Transport";
  if (raw.includes("spotify") || raw.includes("netflix") || raw.includes("stan"))
    return "Entertainment";
  if (raw.includes("gym") || raw.includes("fitness")) return "Health & Fitness";
  if (raw.includes("transfer") || raw.includes("to jared"))
    return "Transfers";
  if (raw.includes("interest") || raw.includes("fee"))
    return "Fees & Charges";

  return "Uncategorized";
}

export default function SpendingByCategory({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    const totals: Record<string, number> = {};

    transactions.forEach((txn) => {
      const category = mapCategory(txn);
      const amt = Math.abs(txn.amount || 0);

      // Only include expenses (negative or outgoing transfers)
      if (txn.amount < 0 || category === "Fees & Charges") {
        totals[category] = (totals[category] || 0) + amt;
      }
    });

    // Sort by total descending
    const sorted = Object.entries(totals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    return sorted;
  }, [transactions]);

  return (
    <Card title="Spending by Category">
      <div className="h-72">
        {data.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No categorized transactions yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: "#fff", borderRadius: 6 }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
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