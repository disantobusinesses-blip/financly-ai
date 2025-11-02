import React, { useMemo } from "react";
import { Account } from "../types";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { computeAccountOverview } from "../utils/metrics";

interface BalanceSummaryProps {
  accounts: Account[];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts }) => {
  const { user } = useAuth();
  const region = user?.region;

  const summary = useMemo(() => {
    return computeAccountOverview(accounts);
  }, [accounts]);

  return (
    <section
      className="futuristic-card hover-zoom flex flex-col gap-7 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur"
      data-tour-id="balance-summary"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-light">Balance summary</p>
        <h2 className="mt-2 text-2xl font-bold">Today&apos;s position</h2>
        <p className="mt-2 text-sm text-white/70">Quickly scan what&apos;s spend-ready, what you owe, and the wealth you&apos;ve built.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-black/40 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Spending ready</p>
          <p className="mt-2 text-3xl font-bold">{formatCurrency(summary.spendingAvailable, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="mt-1 text-xs text-white/60">Cash you can access immediately.</p>
        </div>
        <div className="rounded-2xl bg-black/40 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total net worth</p>
          <p className="mt-2 text-3xl font-bold">{formatCurrency(summary.netWorth, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="mt-1 text-xs text-white/60">Assets minus liabilities right now.</p>
        </div>
        <div className="rounded-2xl bg-black/40 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Liabilities</p>
          <p className="mt-2 text-3xl font-bold">{formatCurrency(summary.totalLiabilities, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="mt-1 text-xs text-white/60">Credit, loans, and mortgages combined.</p>
        </div>
      </div>

      {summary.mortgageAccounts.length > 0 && (
        <div className="rounded-2xl bg-black/30 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Mortgage focus</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            {summary.mortgageAccounts.slice(0, 2).map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                <span>{account.name}</span>
                <span>-{formatCurrency(Math.abs(account.computedBalance), region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            ))}
            {summary.mortgageAccounts.length > 2 && (
              <p className="text-xs text-white/50">+{summary.mortgageAccounts.length - 2} more mortgages or loans</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default BalanceSummary;
