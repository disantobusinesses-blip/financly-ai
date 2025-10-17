import { useMemo } from "react";
import Card from "./Card";
import { Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

interface ShareDatum {
  name: string;
  value: number;
  share: number;
}

export default function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const data = useMemo<ShareDatum[]>(() => {
    if (!transactions || transactions.length === 0) return [];

    const totals = new Map<string, number>();

    transactions.forEach((txn) => {
      if (txn.amount >= 0) return;
      const category = txn.category?.trim() || "General";
      totals.set(category, (totals.get(category) ?? 0) + Math.abs(txn.amount));
    });

    const entries = Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const total = entries.reduce((sum, item) => sum + item.value, 0);

    return entries
      .slice(0, 6)
      .map((item) => ({ ...item, share: total > 0 ? item.value / total : 0 }));
  }, [transactions]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const largest = data[0];

  return (
    <Card
      title="Spending share"
      subtitle="Compare how each category contributes to your overall outgoing spend."
      insights={[
        largest
          ? { label: "Largest", value: largest.name }
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
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No spending activity to analyse yet.
        </p>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-baseline justify-between text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span>{formatCurrency(item.value, region)}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500"
                  style={{ width: `${Math.min(100, Math.round(item.share * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{(item.share * 100).toFixed(1)}% of tracked spend</span>
                <span>Share rank #{data.indexOf(item) + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
