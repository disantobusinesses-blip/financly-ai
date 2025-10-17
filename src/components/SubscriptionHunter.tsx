// src/components/SubscriptionHunter.tsx
import React, { useMemo } from "react";
import { CreditCardIcon } from "@heroicons/react/24/outline";

import { Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

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

  const content = (
    <div className="space-y-4">
      {subscriptions.length > 0 ? (
        <>
          <p className="text-text-secondary">
            We found <span className="font-bold">{subscriptions.length}</span>{" "}
            active subscriptions. You’re spending{" "}
            <span className="font-bold">{formatCurrency(totalSpent, region)}</span>/mo.
          </p>
          <ul className="space-y-2">
            {subscriptions.map((sub) => (
              <li
                key={sub.id}
                className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800 rounded-md px-3 py-2"
              >
                <span className="text-text-primary">{sub.description}</span>
                <span className="text-text-secondary">
                  {formatCurrency(Math.abs(sub.amount), region)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-text-secondary">No subscriptions detected.</p>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCardIcon className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-text-primary">Subscription Hunter</h2>
      </div>

      {content}
    </div>
  );
};

export default SubscriptionHunter;
