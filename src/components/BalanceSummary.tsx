import React, { useMemo } from "react";
import { Account, AccountType } from "../types";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";

interface BalanceSummaryProps {
  accounts: Account[];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts }) => {
  const { user } = useAuth();
  const region = user?.region;

  const summary = useMemo(() => {
    const spendingAccounts = accounts.filter((acc) =>
      [AccountType.CHECKING, AccountType.SAVINGS].includes(acc.type)
    );
    const liabilities = accounts.filter((acc) => acc.balance < 0 || acc.type === AccountType.LOAN);
    const mortgageAccounts = liabilities.filter((acc) => /mortgage/i.test(acc.name));

    const spendingAvailable = spendingAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const totalAssets = accounts.filter((acc) => acc.balance > 0).reduce((sum, acc) => sum + acc.balance, 0);

    return {
      spendingAvailable,
      netWorth,
      totalLiabilities,
      totalAssets,
      mortgageAccounts,
    };
  }, [accounts]);

  return (
    <section
      className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10"
      data-tour-id="balance-summary"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Balance summary</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Spending & net worth</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Split view shows cash available today and the bigger picture across savings, mortgages, and debt.
          </p>
        </div>
        <div className="grid gap-2 text-right text-sm text-slate-500 dark:text-slate-300">
          <div>
            <span className="font-semibold text-slate-700 dark:text-white">Assets:</span> {formatCurrency(summary.totalAssets, region)}
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-white">Liabilities:</span> -{formatCurrency(summary.totalLiabilities, region)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Spending available</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(summary.spendingAvailable, region)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            Includes checking and savings accounts you can access immediately.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total net worth</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(summary.netWorth, region)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            Assets minus liabilities. Track progress every time new data syncs.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Mortgage & debt</p>
          {summary.mortgageAccounts.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-200">
              {summary.mortgageAccounts.map((acc) => (
                <li key={acc.id} className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 dark:bg-slate-700/70">
                  <span>{acc.name}</span>
                  <span>-{formatCurrency(Math.abs(acc.balance), region)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">No mortgage detected. We’ll flag one if it appears.</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"
          >
            <span className="font-semibold text-slate-700 dark:text-white">{acc.name}</span>
            <span className={acc.balance < 0 ? "text-red-500" : "text-emerald-500"}>
              {formatCurrency(acc.balance, region)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BalanceSummary;
