import { useMemo } from "react";
import Card from "./Card";
import { Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import MonthlyDelta from "./MonthlyDelta";

interface CashflowMiniProps {
  transactions: Transaction[];
  region: User["region"];
}

export default function CashflowMini({ transactions, region }: CashflowMiniProps) {
  const monthlyNet = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const totals = new Map<string, { date: Date; net: number }>();

    transactions.forEach((txn) => {
      const date = new Date(txn.date);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = totals.get(key) ?? { date: new Date(date.getFullYear(), date.getMonth(), 1), net: 0 };
      entry.net += txn.amount;
      totals.set(key, entry);
    });

    return Array.from(totals.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map((item) => {
        const label = item.date.toLocaleString(undefined, { month: "short", year: "numeric" });
        const roundedNet = Math.round(item.net);
        return { label, net: roundedNet };
      });
  }, [transactions]);

  if (monthlyNet.length === 0) {
    return (
      <Card title="Cashflow (Monthly)">
        <p className="text-sm text-white/70">Connect your bank to calculate monthly cashflow trends.</p>
      </Card>
    );
  }

  return (
    <Card title="Cashflow (Monthly)">
      <ul className="space-y-3">
        {monthlyNet.map(({ label, net }, index) => {
          const previous = index > 0 ? monthlyNet[index - 1]?.net ?? null : null;
          return (
            <li
              key={label}
              className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80 backdrop-blur"
            >
              <span className="font-semibold uppercase tracking-[0.2em] text-white/60">{label}</span>
              <MonthlyDelta
                currentValue={net}
                previousValue={previous}
                formatter={(value) =>
                  formatCurrency(value, region, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                }
                valueClassName={`text-base font-semibold ${net >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                deltaClassName="text-[0.65rem]"
                className="items-end text-right"
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
