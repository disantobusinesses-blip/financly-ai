import React, { useMemo } from "react";
import { Account, AccountType, Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";

interface FinancialWellnessCardProps {
  accounts: Account[];
  transactions: Transaction[];
  region: User["region"];
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const essentialKeywords = [
  "rent",
  "mortgage",
  "utility",
  "electric",
  "gas",
  "water",
  "insurance",
  "grocer",
  "fuel",
  "petrol",
  "transport",
];

const debtKeywords = ["mortgage", "loan", "credit", "repayment", "debt", "card"];

const FinancialWellnessCard: React.FC<FinancialWellnessCardProps> = ({ accounts, transactions, region }) => {
  const { user } = useAuth();

  const metrics = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    const recentTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return !Number.isNaN(txDate.getTime()) && txDate >= start;
    });

    const monthlyIncome = recentTransactions
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = Math.abs(
      recentTransactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0)
    );

    const essentialSpend = recentTransactions
      .filter((tx) => tx.amount < 0)
      .filter((tx) =>
        essentialKeywords.some((keyword) =>
          `${tx.description} ${tx.category}`.toLowerCase().includes(keyword)
        )
      )
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const lifestyleSpend = Math.max(0, expenses - essentialSpend);
    const savingsAllocated = Math.max(0, monthlyIncome - expenses);

    const savingsRatePct = monthlyIncome > 0 ? clamp((savingsAllocated / monthlyIncome) * 100) : 0;

    const essentialsPct = monthlyIncome > 0 ? clamp((essentialSpend / monthlyIncome) * 100) : 0;
    const lifestylePct = monthlyIncome > 0 ? clamp((lifestyleSpend / monthlyIncome) * 100) : 0;

    const assets = accounts.filter((acc) => acc.balance > 0).reduce((sum, acc) => sum + acc.balance, 0);
    const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const debtTransactions = recentTransactions.filter((tx) => {
      if (tx.amount >= 0) return false;
      const descriptor = `${tx.description} ${tx.category}`.toLowerCase();
      return debtKeywords.some((keyword) => descriptor.includes(keyword));
    });
    const monthlyDebtPayments = debtTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const fallbackDebtPayments = Math.min(expenses * 0.25, expenses);
    const debtPayments = monthlyDebtPayments || fallbackDebtPayments;

    const dti = monthlyIncome > 0 ? debtPayments / monthlyIncome : 1;

    const liabilitiesByAccount = accounts
      .filter((acc) => acc.balance < 0 || acc.type === AccountType.LOAN)
      .map((acc) => ({
        name: acc.name,
        value: Math.abs(acc.balance),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);

    const dtiScore = clamp(100 - dti * 120, 0, 100);
    const netWorthScore = assets > 0 ? clamp(((netWorth + assets) / (assets * 2)) * 100, 0, 100) : 50;
    const cashflowScore = monthlyIncome > 0 ? clamp(((monthlyIncome - expenses) / monthlyIncome) * 100 + 50, 0, 100) : 40;

    const score = Math.round(dtiScore * 0.5 + netWorthScore * 0.3 + cashflowScore * 0.2);

    let dtiLabel = "High";
    if (dti <= 0.25) dtiLabel = "Excellent";
    else if (dti <= 0.35) dtiLabel = "Good";
    else if (dti <= 0.5) dtiLabel = "Elevated";

    const focusMessage =
      dti <= 0.35
        ? "Great trajectory. Keep debt payments under a third of income."
        : dti <= 0.5
        ? "You’re above the preferred 35% range. Channel extra cash toward the largest loan."
        : "Aim to reach 50% break-even by trimming lifestyle spend and paying down the highest-interest debt.";

    return {
      income: monthlyIncome,
      expenses,
      savingsAllocated,
      essentialsPct,
      lifestylePct,
      savingsRatePct,
      netWorth,
      score,
      dti,
      dtiLabel,
      focusMessage,
      liabilitiesByAccount,
      monthlyDebtPayments: debtPayments,
    };
  }, [accounts, transactions, region]);

  const scoreColor = metrics.score >= 75 ? "text-emerald-400" : metrics.score >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <section
      className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl"
      data-tour-id="financial-wellness"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Financial Wellness</p>
          <h2 className="text-3xl font-bold">{user?.displayName || "Your"} wellness score</h2>
          <p className="text-sm text-white/70">Score updates automatically whenever new transactions sync.</p>
        </div>
        <div className="text-right">
          <span className={`text-6xl font-black leading-none ${scoreColor}`}>{metrics.score}</span>
          <span className="text-xl font-semibold text-white/60"> /100</span>
          <p className="text-sm text-white/60">{metrics.focusMessage}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">Debt-to-income</h3>
          <p className="mt-2 text-3xl font-bold text-white">
            {(metrics.dti * 100).toFixed(1)}%
            <span className="ml-2 text-sm font-semibold text-white/60">({metrics.dtiLabel})</span>
          </p>
          <p className="mt-1 text-xs text-white/70">
            Monthly debt {formatCurrency(metrics.monthlyDebtPayments, region)} vs income {formatCurrency(metrics.income, region)}.
          </p>
          <p className="mt-2 text-xs text-white/70">
            Ratio target: 36% or below. Excellent if under 25%. We detected {metrics.liabilitiesByAccount.length || "no"} major
            debt drivers.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {metrics.liabilitiesByAccount.length > 0 ? (
              metrics.liabilitiesByAccount.map((item) => (
                <li key={item.name} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>{item.name}</span>
                  <span>{formatCurrency(item.value, region)}</span>
                </li>
              ))
            ) : (
              <li className="rounded-xl bg-white/5 px-3 py-2 text-center text-white/60">No active loans detected.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl bg-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">50/30/20 rule</h3>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-white">Spend 50% on essentials</p>
              <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                <span>Actual: {metrics.essentialsPct.toFixed(1)}%</span>
                <span>{formatCurrency((metrics.income * metrics.essentialsPct) / 100, region)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, metrics.essentialsPct)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">Enjoy 30% on lifestyle</p>
              <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                <span>Actual: {metrics.lifestylePct.toFixed(1)}%</span>
                <span>{formatCurrency((metrics.income * metrics.lifestylePct) / 100, region)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-secondary"
                  style={{ width: `${Math.min(100, metrics.lifestylePct)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">Put 20% into savings</p>
              <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                <span>Actual: {metrics.savingsRatePct.toFixed(1)}%</span>
                <span>{formatCurrency(metrics.savingsAllocated, region)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${Math.min(100, metrics.savingsRatePct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">Monthly snapshot</h3>
          <ul className="mt-4 space-y-3 text-sm text-white">
            <li className="flex items-center justify-between">
              <span>Income (30 days)</span>
              <strong>{formatCurrency(metrics.income, region)}</strong>
            </li>
            <li className="flex items-center justify-between text-white/80">
              <span>Spending</span>
              <span>{formatCurrency(metrics.expenses, region)}</span>
            </li>
            <li className="flex items-center justify-between text-white/80">
              <span>Net worth</span>
              <span>{formatCurrency(metrics.netWorth, region)}</span>
            </li>
            <li className="flex items-center justify-between text-white/80">
              <span>Saved this month</span>
              <span>{formatCurrency(metrics.savingsAllocated, region)}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-white/60">
            Insights are informational only and not financial advice.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinancialWellnessCard;
