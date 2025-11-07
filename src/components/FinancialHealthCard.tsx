import React, { useMemo } from "react";
import { Account, Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { calculateWellnessMetrics } from "../utils/metrics";
import MonthlyDelta from "./MonthlyDelta";

interface FinancialHealthCardProps {
  accounts: Account[];
  transactions: Transaction[];
  region: User["region"];
}

const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ accounts, transactions, region }) => {
  const { user } = useAuth();

  const metrics = useMemo(() => calculateWellnessMetrics(accounts, transactions), [accounts, transactions]);
  const debtHighlights =
    metrics.liabilitiesByAccount.length > 0
      ? metrics.liabilitiesByAccount
      : metrics.overview.mortgageAccounts
          .map((account) => ({ name: account.name, value: Math.abs(account.computedBalance) }))
          .slice(0, 2);

  const savingsRatePct = metrics.monthlyIncome > 0 ? (metrics.savingsAllocated / metrics.monthlyIncome) * 100 : 0;

  const scoreColor = metrics.score >= 75 ? "text-emerald-400" : metrics.score >= 50 ? "text-amber-400" : "text-red-400";
  const discretionaryWeekly =
    metrics.dti < 0.5
      ? Math.max(
          0,
          (metrics.monthlyIncome - metrics.monthlyDebtPayments - metrics.budget.totals.Essentials) / 4
        )
      : 0;
  const extraSavings = Math.max(0, metrics.savingsAmount - metrics.targetAmounts.Savings);
  const goalAccelerationWeeks =
    extraSavings > 0 && metrics.savingsAmount > 0
      ? Math.max(1, Math.round((extraSavings / Math.max(metrics.savingsAmount, 1)) * 4))
      : 0;

  return (
    <section
      className="futuristic-card hover-zoom rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur"
      data-tour-id="financial-health"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Financial Health</p>
          <h2 className="text-3xl font-bold">{user?.displayName || "Your"} health score</h2>
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
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">Debt-to-income focus</h3>
          <p className="mt-2 text-3xl font-bold text-white">
            {(metrics.dti * 100).toFixed(1)}%
            <span className="ml-2 text-sm font-semibold text-white/60">({metrics.dtiLabel})</span>
          </p>
          <p className="mt-1 text-xs text-white/70">
            Monthly debt {formatCurrency(metrics.monthlyDebtPayments, region)} vs income {formatCurrency(metrics.monthlyIncome, region)}.
          </p>
          <p className="mt-2 text-xs text-white/70">
            Ratio target: 36% or below. Excellent if under 25%. We detected {debtHighlights.length || "no"} major debt drivers.
          </p>
          {metrics.dti < 0.5 && (
            <div className="mt-3 space-y-2 rounded-2xl bg-white/5 p-3 text-xs text-white/80">
              <p>
                Weekly treat budget: <strong>{formatCurrency(discretionaryWeekly, region)}</strong>. Enjoy it on lifestyle boosts or
                skill-building experiences.
              </p>
              {extraSavings > 0 && (
                <p>
                  You saved an additional <strong>{formatCurrency(extraSavings, region)}</strong> this month — move it into a goal
                  account to finish about {goalAccelerationWeeks} week{goalAccelerationWeeks === 1 ? "" : "s"} faster.
                </p>
              )}
            </div>
          )}
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {debtHighlights.length > 0 ? (
              debtHighlights.map((item) => (
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
              <MonthlyDelta
                currentValue={metrics.essentialsAmount}
                previousValue={metrics.budget.previousTotals.Essentials}
                formatter={(value) => formatCurrency(value, region)}
                valueClassName="text-lg font-semibold text-white"
                deltaClassName="text-[0.65rem]"
                className="mt-2 items-start text-left"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                <span>Actual: {metrics.essentialsPercent.toFixed(1)}%</span>
                <span>Target {metrics.targetPercentages.Essentials}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, metrics.essentialsPercent)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                <span>Target {formatCurrency(metrics.targetAmounts.Essentials, region)}</span>
                <span>Last month {formatCurrency(metrics.budget.previousTotals.Essentials, region)}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">Enjoy 30% on lifestyle</p>
              <MonthlyDelta
                currentValue={metrics.lifestyleAmount}
                previousValue={metrics.budget.previousTotals.Lifestyle}
                formatter={(value) => formatCurrency(value, region)}
                valueClassName="text-lg font-semibold text-white"
                deltaClassName="text-[0.65rem]"
                className="mt-2 items-start text-left"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                <span>Actual: {metrics.lifestylePercent.toFixed(1)}%</span>
                <span>Target {metrics.targetPercentages.Lifestyle}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-secondary"
                  style={{ width: `${Math.min(100, metrics.lifestylePercent)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                <span>Target {formatCurrency(metrics.targetAmounts.Lifestyle, region)}</span>
                <span>Last month {formatCurrency(metrics.budget.previousTotals.Lifestyle, region)}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">Put 20% into savings</p>
              <MonthlyDelta
                currentValue={metrics.savingsAmount}
                previousValue={metrics.budget.previousTotals.Savings}
                formatter={(value) => formatCurrency(value, region)}
                valueClassName="text-lg font-semibold text-white"
                deltaClassName="text-[0.65rem]"
                className="mt-2 items-start text-left"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                <span>Actual: {metrics.savingsPercent.toFixed(1)}%</span>
                <span>Target {metrics.targetPercentages.Savings}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${Math.min(100, metrics.savingsPercent)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                <span>Target {formatCurrency(metrics.targetAmounts.Savings, region)}</span>
                <span>Last month {formatCurrency(metrics.budget.previousTotals.Savings, region)}</span>
              </div>
            </div>
            <p className="text-xs text-white/60">
              Including surplus cash, your savings rate is {savingsRatePct.toFixed(1)}% of monthly income.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">Monthly snapshot</h3>
          <ul className="mt-4 space-y-3 text-sm text-white">
            <li className="flex items-center justify-between">
              <span>Income (30 days)</span>
              <MonthlyDelta
                currentValue={metrics.monthlyIncome}
                previousValue={metrics.budget.previousIncome}
                formatter={(value) => formatCurrency(value, region)}
                valueClassName="text-lg font-semibold text-white"
                deltaClassName="text-[0.65rem]"
                className="items-end text-right"
              />
            </li>
            <li className="flex items-center justify-between text-white/80">
              <span>Spending</span>
              <MonthlyDelta
                currentValue={metrics.expenses}
                previousValue={metrics.budget.previousExpenses}
                formatter={(value) => formatCurrency(value, region)}
                valueClassName="text-lg font-semibold text-white"
                deltaClassName="text-[0.65rem]"
                className="items-end text-right"
              />
            </li>
            <li className="flex items-center justify-between text-white/80">
              <span>Net worth</span>
              <MonthlyDelta
                currentValue={metrics.netWorth}
                previousValue={metrics.previousNetWorth}
                formatter={(value) => formatCurrency(value, region)}
                valueClassName="text-lg font-semibold text-white"
                deltaClassName="text-[0.65rem]"
                className="items-end text-right"
              />
            </li>
            <li className="flex items-center justify-between text-white/80">
              <span>Saved this month</span>
              <MonthlyDelta
                currentValue={metrics.savingsAllocated}
                previousValue={metrics.budget.previousSavingsAllocated}
                formatter={(value) => formatCurrency(value, region)}
                valueClassName="text-lg font-semibold text-white"
                deltaClassName="text-[0.65rem]"
                className="items-end text-right"
              />
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

export default FinancialHealthCard;
