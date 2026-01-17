import React, { useMemo } from "react";
import { Transaction } from "../types";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/currency";

export interface SubscriptionSummary {
  name: string;
  count: number;
  total: number;
}

export const deriveSubscriptionSummary = (transactions: Transaction[]): SubscriptionSummary[] => {
  const grouped = new Map<string, { total: number; count: number }>();

  transactions
    .filter((tx) => tx.category === "Subscriptions" || /subscription|netflix|spotify|disney|prime/i.test(tx.description))
    .forEach((tx) => {
      const key = tx.description.trim();
      const existing = grouped.get(key) || { total: 0, count: 0 };
      existing.total += Math.abs(tx.amount);
      existing.count += 1;
      grouped.set(key, existing);
    });

  return Array.from(grouped.entries())
    .map(([name, info]) => ({ name, total: info.total, count: info.count }))
    .sort((a, b) => b.total - a.total);
};

interface Props {
  transactions: Transaction[];
  region: "AU" | "US";
}

const SubscriptionHunter: React.FC<Props> = ({ transactions, region }) => {
  const summary = useMemo(() => deriveSubscriptionSummary(transactions), [transactions]);
  const totalSpent = summary.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur" data-tour-id="subscription-hunter">
      <div className="mb-4 flex items-center gap-3">
        <CreditCardIcon className="h-6 w-6 text-[#1F0051]" />
        <div>
          <h2 className="text-lg font-semibold text-white">Subscription Hunter</h2>
          <p className="text-sm text-white/60">
            We group identical merchants so you can see recurring charges clearly.
          </p>
        </div>
      </div>

      {summary.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
          No recurring services detected yet.
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-semibold text-white/80">
            Found {summary.length} subscriptions costing{" "}
            <span className="text-white">{formatCurrency(totalSpent, region)}</span> per month.
          </div>

          <ul className="space-y-3 text-sm">
            {summary.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/80"
              >
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/50">Charged {item.count} times</p>
                </div>
                <span className="font-semibold text-white">{formatCurrency(item.total, region)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 text-xs text-white/40">Insights are informational only.</p>
    </div>
  );
};

export default SubscriptionHunter;
