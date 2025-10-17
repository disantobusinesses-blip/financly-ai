import { useMemo } from "react";
import { Transaction } from "../types";
import Card from "./Card";
import { formatCurrency } from "../utils/currency";
import { formatTransactionDate } from "../utils/transactions";
import { useAuth } from "../contexts/AuthContext";

const CATEGORY_ACCENTS: Record<string, string> = {
  Income: "bg-emerald-100 text-emerald-700",
  Groceries: "bg-lime-100 text-lime-700",
  "Dining Out": "bg-orange-100 text-orange-700",
  Shopping: "bg-sky-100 text-sky-700",
  Transport: "bg-purple-100 text-purple-700",
  Utilities: "bg-cyan-100 text-cyan-700",
  Housing: "bg-amber-100 text-amber-700",
  "Health & Fitness": "bg-rose-100 text-rose-700",
  "Debt Repayments": "bg-red-100 text-red-700",
  "Fees & Charges": "bg-slate-100 text-slate-600",
  Subscriptions: "bg-indigo-100 text-indigo-700",
  Travel: "bg-fuchsia-100 text-fuchsia-700",
  Insurance: "bg-teal-100 text-teal-700",
  Education: "bg-yellow-100 text-yellow-700",
  Savings: "bg-emerald-100 text-emerald-700",
  Transfers: "bg-slate-100 text-slate-600",
};

const getCategoryAccent = (category: string) =>
  CATEGORY_ACCENTS[category] ?? "bg-slate-100 text-slate-600";

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
          <p className="py-10 text-center text-sm text-slate-500">No transactions yet.</p>
        ) : (
          sortedTxns.map((txn: Transaction) => {
            const category = txn.category || "General Spending";
            const badgeClass = getCategoryAccent(category);
            const dateLabel = formatTransactionDate(txn.date, locale);
            const amountValue =
              typeof txn.amount === "number"
                ? txn.amount
                : Number.parseFloat(String(txn.amount || 0));
            const amountColor = amountValue < 0 ? "text-rose-600" : "text-emerald-600";
            return (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {txn.description || "Unnamed"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400">{dateLabel}</span>
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
