import { Transaction } from "../types";
import Card from "./Card";
import { formatCurrency } from "../utils/currency";
import { formatTransactionDate } from "../utils/transactions";
import { useAuth } from "../contexts/AuthContext";

const CATEGORY_ACCENTS: Record<string, string> = {
  Income: "bg-emerald-500/10 text-emerald-400",
  "Groceries": "bg-lime-500/10 text-lime-500",
  "Dining Out": "bg-orange-500/10 text-orange-400",
  "Shopping": "bg-sky-500/10 text-sky-400",
  "Transport": "bg-purple-500/10 text-purple-400",
  "Utilities": "bg-cyan-500/10 text-cyan-400",
  "Housing": "bg-amber-500/10 text-amber-500",
  "Health & Fitness": "bg-rose-500/10 text-rose-400",
  "Debt Repayments": "bg-red-500/10 text-red-400",
  "Fees & Charges": "bg-slate-500/10 text-slate-300",
  Subscriptions: "bg-indigo-500/10 text-indigo-400",
  Travel: "bg-fuchsia-500/10 text-fuchsia-400",
  Insurance: "bg-teal-500/10 text-teal-400",
  Education: "bg-yellow-500/10 text-yellow-500",
  Savings: "bg-emerald-500/10 text-emerald-400",
  Transfers: "bg-slate-500/10 text-slate-300",
};

const getCategoryAccent = (category: string) =>
  CATEGORY_ACCENTS[category] ?? "bg-slate-600/10 text-slate-200";

export default function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  const { user } = useAuth();
  const region = user?.region || "AU";
  const locale = region === "US" ? "en-US" : "en-AU";

  // Sort directly — no useMemo needed
  const sortedTxns = [...transactions].sort(
    (a: Transaction, b: Transaction) => Date.parse(b.date) - Date.parse(a.date)
  );

  return (
    <Card title="Recent Transactions">
      <div className="overflow-y-auto max-h-96 divide-y divide-gray-800">
        {sortedTxns.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No transactions yet.
          </p>
        ) : (
          sortedTxns.map((txn: Transaction) => {
            const category = txn.category || "General Spending";
            const badgeClass = getCategoryAccent(category);
            const dateLabel = formatTransactionDate(txn.date, locale);
            const amountValue =
              typeof txn.amount === "number"
                ? txn.amount
                : Number.parseFloat(String(txn.amount || 0));
            const amountColor = amountValue < 0 ? "text-red-400" : "text-green-400";
            return (
              <div
                key={txn.id}
                className="flex justify-between items-center py-2 px-1 hover:bg-white/5 transition rounded-md"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {txn.description || "Unnamed"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{dateLabel}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                      {category}
                    </span>
                  </div>
                </div>
                <p className={`font-semibold ${amountColor}`}>
                  {formatCurrency(amountValue, region)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}