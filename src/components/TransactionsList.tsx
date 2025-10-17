import { Transaction } from "../types";
import Card from "./Card";
import { formatCurrency } from "../utils/currency";
import { formatTransactionDate } from "../utils/transactions";
import { useAuth } from "../contexts/AuthContext";
import { useMemo } from "react";

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

  const sortedTxns = useMemo(
    () =>
      [...transactions].sort(
        (a: Transaction, b: Transaction) => Date.parse(b.date) - Date.parse(a.date)
      ),
    [transactions]
  );

  const totals = useMemo(() => {
    const income = sortedTxns
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);
    const expenses = sortedTxns
      .filter((txn) => txn.amount < 0)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    return { income, expenses };
  }, [sortedTxns]);

  return (
    <Card
      title="Recent transactions"
      subtitle="A live feed of everything hitting your accounts."
      insights={[
        { label: "Entries", value: String(sortedTxns.length) },
        {
          label: "Income",
          value: formatCurrency(totals.income, region),
          tone: "positive",
        },
        {
          label: "Outgoings",
          value: formatCurrency(totals.expenses, region),
          tone: "negative",
        },
      ]}
    >
      <div className="max-h-96 space-y-2 overflow-y-auto pr-2">
        {sortedTxns.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/70">
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
            const amountColor = amountValue < 0 ? "text-rose-200" : "text-emerald-200";
            return (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {txn.description || "Unnamed"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/60">{dateLabel}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${badgeClass}`}>
                      {category}
                    </span>
                  </div>
                </div>
                <p className={`shrink-0 text-sm font-semibold ${amountColor}`}>
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