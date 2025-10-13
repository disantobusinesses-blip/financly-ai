import React, { useMemo } from "react";
import { Transaction } from "../types";
import Card from "./Card";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";

// optional: same helper used in SpendingByCategory
function mapCategory(txn: Transaction): string {
  const desc = txn.description?.toLowerCase() || "";
  if (desc.includes("salary")) return "Income";
  if (desc.includes("coles") || desc.includes("woolworth")) return "Groceries";
  if (desc.includes("afterpay")) return "Debt";
  if (desc.includes("spotify") || desc.includes("netflix")) return "Entertainment";
  if (desc.includes("rent")) return "Housing";
  if (desc.includes("uber") || desc.includes("fuel")) return "Transport";
  return "Other";
}

export default function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  const { user } = useAuth();
  const region = user?.region || "AU";

  const sortedTxns = useMemo(() => {
    return [...transactions].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }, [transactions]);

  return (
    <Card title="Recent Transactions">
      <div className="overflow-y-auto max-h-96 divide-y divide-gray-800">
        {sortedTxns.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No transactions yet.</p>
        ) : (
          sortedTxns.map((txn) => {
            const category = mapCategory(txn);
            const amountColor = txn.amount < 0 ? "text-red-400" : "text-green-400";
            return (
              <div
                key={txn.id}
                className="flex justify-between items-center py-2 px-1 hover:bg-white/5 transition rounded-md"
              >
                <div>
                  <p className="text-white text-sm font-medium">{txn.description || "Unnamed"}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(txn.date).toLocaleDateString()} · {category}
                  </p>
                </div>
                <p className={`font-semibold ${amountColor}`}>
                  {formatCurrency(txn.amount, region)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}