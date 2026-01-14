import React, { useMemo } from "react";
import { Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import { summariseMonthlyBudget } from "../utils/spending";

interface FinancialHealthCardProps {
  transactions: Transaction[];
  region: User["region"];
}

const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ transactions, region }) => {
  const budget = useMemo(() => summariseMonthlyBudget(transactions), [transactions]);
  const income = budget.income;
  const outgoings = budget.totalOutflow;
  const net = income - outgoings;
  const netMargin = income > 0 ? (net / income) * 100 : 0;
  const status = net >= 0 ? "Surplus" : "Deficit";
  const statusColor = net >= 0 ? "text-emerald-400" : "text-rose-400";
  const marginColor = netMargin >= 10 ? "bg-emerald-400" : netMargin >= 0 ? "bg-amber-400" : "bg-rose-400";

  return (
    <section
      className="futuristic-card hover-zoom rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur"
      data-tour-id="financial-health"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Cashflow precision</p>
          <h2 className="text-3xl font-bold">Income vs outgoings</h2>
          <p className="text-sm text-white/70">
            Deterministic signal based purely on the last 30 days of income and outgoings.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Net cashflow</p>
          <p className={`text-3xl font-bold ${statusColor}`}>{formatCurrency(net, region)}</p>
          <p className="text-sm text-white/60">{status}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">Income</h3>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatCurrency(income, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-xs text-white/60">Total inflows over the last 30 days.</p>
        </div>

        <div className="rounded-2xl bg-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">Outgoings</h3>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatCurrency(outgoings, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-xs text-white/60">All expenses, bills, and savings transfers.</p>
        </div>

        <div className="rounded-2xl bg-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">Net margin</h3>
          <p className="mt-3 text-2xl font-semibold text-white">{netMargin.toFixed(1)}%</p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${marginColor}`}
              style={{ width: `${Math.min(100, Math.max(0, netMargin + 50))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/60">
            Positive margin means income comfortably covers outgoings.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinancialHealthCard;
