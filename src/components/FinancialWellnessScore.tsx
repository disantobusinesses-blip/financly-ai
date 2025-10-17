import { useMemo } from "react";
import { Account, Transaction } from "../types";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";

interface FinancialWellnessScoreProps {
  accounts: Account[];
  transactions: Transaction[];
}

const getScoreLabel = (score: number) => {
  if (score >= 80) {
    return {
      label: "Excellent",
      summary: "Your finances are in great shape and trending upward.",
    };
  }

  if (score >= 65) {
    return {
      label: "On Track",
      summary: "Solid footing with room to optimise discretionary spending.",
    };
  }

  if (score >= 45) {
    return {
      label: "Building",
      summary: "Keep chipping away at debt and boosting your savings rate.",
    };
  }

  return {
    label: "Watchlist",
    summary: "Revisit recurring spend and debt commitments this month.",
  };
};

export default function FinancialWellnessScore({
  accounts,
  transactions,
}: FinancialWellnessScoreProps) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const {
    netWorth,
    assets,
    liabilities,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    debtToIncome,
    score,
    topSpendingCategory,
    topSpendingAmount,
  } = useMemo(() => {
    const toNumber = (value: unknown) => {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
      }
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const totals = accounts.reduce(
      (acc, account) => {
        const balance = toNumber(account.balance);
        if (balance >= 0) {
          acc.assets += balance;
        } else {
          acc.liabilities += Math.abs(balance);
        }
        return acc;
      },
      { assets: 0, liabilities: 0 }
    );

    const netWorthValue = totals.assets - totals.liabilities;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime());
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recent = transactions.filter((txn) => {
      const parsed = new Date(txn.date);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed >= thirtyDaysAgo &&
        parsed <= now
      );
    });

    const income = recent.reduce((sum, txn) => {
      const amount = toNumber(txn.amount);
      return amount > 0 ? sum + amount : sum;
    }, 0);

    const expenses = recent.reduce((sum, txn) => {
      const amount = toNumber(txn.amount);
      return amount < 0 ? sum + Math.abs(amount) : sum;
    }, 0);

    const savingsRateValue = income > 0 ? (income - expenses) / income : 0;
    const debtToIncomeValue = income > 0 ? totals.liabilities / income : 0;

    const netWorthScore = Math.max(0, Math.min(40, (netWorthValue / 1000) * 5));
    const savingsScore = Math.max(
      0,
      Math.min(35, Math.max(0, savingsRateValue) * 100 * 0.35)
    );
    const debtScore = Math.max(0, Math.min(25, 25 - debtToIncomeValue * 40));
    const compositeScore = Math.round(
      Math.max(5, Math.min(95, netWorthScore + savingsScore + debtScore))
    );

    const spendingByCategory: Record<string, number> = {};
    recent.forEach((txn) => {
      const amount = toNumber(txn.amount);
      if (amount < 0) {
        const category = txn.category || "General Spending";
        spendingByCategory[category] =
          (spendingByCategory[category] || 0) + Math.abs(amount);
      }
    });

    const [topCategory, topAmount] =
      Object.entries(spendingByCategory).sort((a, b) => b[1] - a[1])[0] ?? [
        null,
        0,
      ];

    return {
      netWorth: netWorthValue,
      assets: totals.assets,
      liabilities: totals.liabilities,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      savingsRate: savingsRateValue,
      debtToIncome: debtToIncomeValue,
      score: compositeScore,
      topSpendingCategory: topCategory,
      topSpendingAmount: topAmount,
    };
  }, [accounts, transactions]);

  const { label, summary } = getScoreLabel(score);
  const savingsRatePercent = Math.round(savingsRate * 100);
  const debtToIncomeRatio = debtToIncome > 0
    ? Math.max(0, Math.min(9.99, Number.isFinite(debtToIncome) ? debtToIncome : 0))
    : 0;

  if (!accounts.length) {
    return (
      <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-sm text-text-secondary">
        Connect a bank account to unlock your personalised Financial Wellness
        Score.
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-indigo-800 text-white shadow-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-indigo-400/30 blur-2xl"
      />
      <div className="relative p-6 md:p-8 space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Financial wellness
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <span className="text-5xl font-black leading-none">{score}</span>
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {label}
                </span>
                <p className="max-w-xs text-sm text-white/80">{summary}</p>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          <div className="grid w-full max-w-sm grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-white/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Net worth
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(netWorth, region)}
              </p>
            </div>
            <div className="rounded-xl bg-white/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Savings rate
              </p>
              <p className="mt-1 text-lg font-semibold">{savingsRatePercent}%</p>
            </div>
            <div className="rounded-xl bg-white/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Assets
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(assets, region)}
              </p>
            </div>
            <div className="rounded-xl bg-white/20 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Liabilities
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(-Math.abs(liabilities), region)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm text-white/80 md:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">
              30-day income
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(monthlyIncome, region)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">
              30-day spend
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(-Math.abs(monthlyExpenses), region)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Debt-to-income
            </p>
            <p className="mt-1 text-lg font-semibold">
              {debtToIncomeRatio.toFixed(2)}x
            </p>
          </div>
        </div>

        {topSpendingCategory && topSpendingAmount > 0 && (
          <div className="rounded-xl bg-white/10 p-4 text-sm">
            <p className="font-semibold text-white">
              Biggest opportunity: {topSpendingCategory}
            </p>
            <p className="mt-1 text-white/80">
              You've spent {formatCurrency(-Math.abs(topSpendingAmount), region)}
              {" "}
              in the last 30 days. Set a mindful limit to unlock more savings.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
