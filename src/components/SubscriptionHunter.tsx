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
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10" data-tour-id="subscription-hunter">
      <div className="mb-4 flex items-center gap-3">
        <CreditCardIcon className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Hunter</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            We group identical merchants so you can see how often they hit your account.
          </p>
        </div>
      </div>

      {summary.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-300">No recurring services detected yet.</p>
      ) : (
        <>
          <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Found {summary.length} active subscriptions costing {formatCurrency(totalSpent, region)} per month.
          </div>
          <ul className="space-y-3 text-sm">
            {summary.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Charged {item.count} times</p>
                </div>
                <span className="font-semibold">{formatCurrency(item.total, region)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        Insights are informational only and not financial advice.
      </p>
    </div>
  );
};

export default SubscriptionHunter;
