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

  // Naive recurring detection: any transaction with category "Subscriptions"
  const subscriptions = useMemo(
    () => transactions.filter((t) => t.category === "Subscriptions"),
    [transactions]
  );

  const totalSpent = subscriptions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const region = user?.region;

  return (
    <Card
      title="Subscription hunter"
      subtitle="Track recurring charges, spot price hikes and cancel the ones you don’t need."
      icon={<CreditCardIcon className="h-6 w-6" />}
      insights={[
        { label: "Active", value: String(subscriptions.length) },
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
      {subscriptions.length > 0 ? (
        <ul className="space-y-3 text-sm text-white/80">
          {subscriptions.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-3"
            >
              <div>
                <p className="font-semibold text-white">{sub.description}</p>
                <p className="text-xs uppercase tracking-wide text-white/60">
                  {formatCurrency(Math.abs(sub.amount), region)} / month
                </p>
              </div>
              <button className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20">
                Cancel
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/70">No subscriptions detected.</p>
      )}
    </Card>
  );
};

export default SubscriptionHunter;
