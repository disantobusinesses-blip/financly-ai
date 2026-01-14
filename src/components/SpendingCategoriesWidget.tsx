import React, { useMemo } from "react";
import { Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import { classifyTransaction, THIRTY_DAYS_MS } from "../utils/spending";
import Card from "./Card";

interface SpendingCategoriesWidgetProps {
  transactions: Transaction[];
  region: User["region"];
}

type CategoryTotal = {
  category: string;
  total: number;
};

const SpendingCategoriesWidget: React.FC<SpendingCategoriesWidgetProps> = ({ transactions, region }) => {
  const { categories, income, goodExpenses, badExpenses, maxCategoryTotal } = useMemo(() => {
    const endTime = Date.now();
    const startTime = endTime - THIRTY_DAYS_MS;
    const totals = new Map<string, number>();
    let incomeTotal = 0;
    let goodTotal = 0;
    let badTotal = 0;

    transactions.forEach((transaction) => {
      const timestamp = new Date(transaction.date).getTime();
      if (Number.isNaN(timestamp) || timestamp < startTime || timestamp > endTime) return;

      const amount = Number(transaction.amount) || 0;
      if (amount > 0) {
        incomeTotal += amount;
        return;
      }

      const category = transaction.category || "Uncategorised";
      totals.set(category, (totals.get(category) || 0) + Math.abs(amount));

      const classification = classifyTransaction(transaction);
      if (classification === "Lifestyle") {
        badTotal += Math.abs(amount);
      } else if (classification === "Essentials" || classification === "Savings") {
        goodTotal += Math.abs(amount);
      }
    });

    const categoriesList: CategoryTotal[] = Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
    const maxValue = categoriesList[0]?.total ?? 0;

    return {
      categories: categoriesList,
      income: incomeTotal,
      goodExpenses: goodTotal,
      badExpenses: badTotal,
      maxCategoryTotal: maxValue,
    };
  }, [transactions]);

  return (
    <Card title="Spending categories">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/40 px-4 py-3 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Income</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">
            {formatCurrency(income, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-2xl bg-black/40 px-4 py-3 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Good expenses</p>
          <p className="mt-1 text-lg font-semibold text-sky-300">
            {formatCurrency(goodExpenses, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-2xl bg-black/40 px-4 py-3 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Bad expenses</p>
          <p className="mt-1 text-lg font-semibold text-rose-300">
            {formatCurrency(badExpenses, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-2 text-sm">
        {categories.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/70">
            We&apos;ll populate category breakdowns after you have 30 days of transactions.
          </div>
        ) : (
          categories.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                <span>{item.category}</span>
                <span className="text-white/80">
                  {formatCurrency(item.total, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#1F0051] transition-all"
                  style={{ width: `${maxCategoryTotal ? (item.total / maxCategoryTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default SpendingCategoriesWidget;
