// src/components/SubscriptionHunter.tsx
import React, { useMemo } from "react";
import { CreditCardIcon } from "@heroicons/react/24/outline";

import { Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import Card from "./Card";

interface Props {
  transactions: Transaction[];
}

const SubscriptionHunter: React.FC<Props> = ({ transactions }) => {
  const { user } = useAuth();

  const region = user?.region;

  const groupedSubscriptions = useMemo(() => {
    const recurring = transactions.filter((t) => t.category === "Subscriptions");

    const map = new Map<
      string,
      {
        name: string;
        total: number;
        count: number;
        average: number;
        lastDate: string | null;
      }
    >();

    recurring.forEach((txn) => {
      const descriptor = txn.description?.trim() || txn.id;
      const key = descriptor.toLowerCase();
      const displayName = descriptor.replace(/\b[a-z]/g, (char) => char.toUpperCase());
      const entry = map.get(key);
      const amount = Math.abs(txn.amount);
      const txnDate = new Date(txn.date);
      const formattedDate = Number.isNaN(txnDate.getTime())
        ? null
        : txnDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

      if (entry) {
        const updatedCount = entry.count + 1;
        const updatedTotal = entry.total + amount;
        map.set(key, {
          ...entry,
          total: updatedTotal,
          count: updatedCount,
          average: updatedTotal / updatedCount,
          lastDate: formattedDate ?? entry.lastDate,
        });
      } else {
        map.set(key, {
          name: displayName || "Subscription",
          total: amount,
          count: 1,
          average: amount,
          lastDate: formattedDate,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const totalSpent = groupedSubscriptions.reduce((sum, sub) => sum + sub.total, 0);
  const activeCount = groupedSubscriptions.length;

  return (
    <Card
      title="Subscription hunter"
      subtitle="Track recurring charges, spot price hikes and cancel the ones you don’t need."
      icon={<CreditCardIcon className="h-6 w-6" />}
      insights={[
        { label: "Unique", value: String(activeCount) },
        {
          label: "Monthly spend",
          value: formatCurrency(totalSpent, region),
          tone: totalSpent > 0 ? "negative" : "neutral",
        },
        {
          label: "Region",
          value: region ?? "AU",
        },
      ]}
    >
      {groupedSubscriptions.length > 0 ? (
        <ul className="space-y-3 text-sm text-slate-600">
          {groupedSubscriptions.map((sub) => (
            <li
              key={sub.name}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{sub.name}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {formatCurrency(sub.average, region)} avg · {sub.count} charge
                  {sub.count === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(sub.total, region)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Last billed {sub.lastDate ?? "recently"}
                  </p>
                </div>
                <button className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No subscriptions detected.</p>
      )}
    </Card>
  );
};

export default SubscriptionHunter;
