import React, { useMemo } from "react";
import { Account, Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { computeAccountOverview } from "../utils/metrics";
import { THIRTY_DAYS_MS } from "../utils/spending";

interface BalanceSummaryProps {
  accounts: Account[];
  transactions: Transaction[];
  region: User["region"];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({ accounts, transactions, region }) => {
  const { user } = useAuth();
  const activeRegion = region ?? user?.region;

  const summary = useMemo(() => {
    return computeAccountOverview(accounts);
  }, [accounts]);

  const fixedExpenses = useMemo(() => {
    const endTime = Date.now();
    const startTime = endTime - THIRTY_DAYS_MS;
    const FIXED_KEYWORDS = [
      "rent",
      "mortgage",
      "loan",
      "repayment",
      "insurance",
      "electric",
      "gas",
      "water",
      "utility",
      "internet",
      "phone",
      "mobile",
      "council",
      "rates",
      "registration",
      "car",
      "fuel",
      "petrol",
    ];

    return transactions.reduce((total, transaction) => {
      const timestamp = new Date(transaction.date).getTime();
      if (Number.isNaN(timestamp) || timestamp < startTime || timestamp > endTime) return total;
      if (transaction.amount >= 0) return total;
      const descriptor = `${transaction.description} ${transaction.category}`.toLowerCase();
      if (!FIXED_KEYWORDS.some((keyword) => descriptor.includes(keyword))) return total;
      return total + Math.abs(transaction.amount);
    }, 0);
  }, [transactions]);

  return (
    <section
      className="futuristic-card hover-zoom flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur"
      data-tour-id="balance-summary"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-light">Balance summary</p>
        <h2 className="mt-2 text-2xl font-bold">Where you stand</h2>
        <p className="mt-1 text-sm text-white/70">A quick snapshot of cash on hand, net worth, and fixed expenses.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-black/30 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total cash</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(summary.spendingAvailable, activeRegion, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="mt-1 text-xs text-white/60">Available in spending and savings accounts.</p>
        </div>
        <div className="rounded-2xl bg-black/30 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Net worth</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(summary.netWorth, activeRegion, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-white/60">Total assets minus liabilities.</p>
        </div>
        <div className="rounded-2xl bg-black/30 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Fixed expenses</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(fixedExpenses, activeRegion, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-white/60">Rent, mortgage, car, utilities, and bills.</p>
        </div>
      </div>
    </section>
  );
};

export default BalanceSummary;
