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
    topDebtAccount,
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
          const liability = Math.abs(balance);
          acc.liabilities += liability;
          if (liability > acc.heaviest.amount) {
            acc.heaviest = {
              name: account.name || "Largest liability",
              amount: liability,
            };
          }
        }
        return acc;
      },
      { assets: 0, liabilities: 0, heaviest: { name: "", amount: 0 } }
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
      topDebtAccount:
        totals.heaviest.amount > 0 ? totals.heaviest : { name: "", amount: 0 },
    };
  }, [accounts, transactions]);

  const { label, summary } = getScoreLabel(score);
  const savingsRatePercent = Math.round(savingsRate * 100);
  const debtToIncomePercent = debtToIncome > 0 && Number.isFinite(debtToIncome)
    ? Math.max(0, debtToIncome * 100)
    : 0;
  const scoreTone =
    score >= 75 ? "text-emerald-200" : score >= 50 ? "text-amber-200" : "text-rose-200";
  const scoreBackground =
    score >= 75 ? "bg-emerald-400/25" : score >= 50 ? "bg-amber-400/25" : "bg-rose-400/25";
  const debtTone =
    debtToIncomePercent <= 35
      ? "text-emerald-100"
      : debtToIncomePercent <= 50
      ? "text-amber-100"
      : "text-rose-100";
  const debtIncomeRatio =
    debtToIncome > 0 && Number.isFinite(debtToIncome) ? debtToIncome : 0;
  const formattedDebtRatio = debtIncomeRatio > 0 ? `${debtIncomeRatio.toFixed(2)} : 1` : "0 : 1";
  const largestDebtName =
    topDebtAccount && topDebtAccount.amount > 0
      ? topDebtAccount.name || "your largest liability"
      : null;
  const largestDebtAmount =
    topDebtAccount && topDebtAccount.amount > 0
      ? topDebtAccount.amount
      : 0;
  const driverMessage =
    largestDebtAmount > 0
      ? `${largestDebtName} is driving ${formatCurrency(
          -Math.abs(largestDebtAmount),
          region
        )} of your liabilities.`
      : "Liabilities are light right now—keep repayments consistent to preserve the advantage.";
  const debtStatus =
    debtToIncomePercent <= 25
      ? {
          label: "Excellent debt-to-income",
          action:
            "Keep autopaying principal and divert surplus cash toward savings goals to stay well below 25%.",
        }
      : debtToIncomePercent <= 35
      ? {
          label: "Good shape — push toward excellent",
          action:
            "Redirect bonuses or windfalls to the largest balance and avoid new financing until you glide under 25%.",
        }
      : debtToIncomePercent <= 50
      ? {
          label: "Caution: debt load rising",
          action:
            "Target high-interest balances first and pause new discretionary commitments until you're back under 36%.",
        }
      : {
          label: "High risk debt load",
          action:
            "Freeze new debt, schedule aggressive repayments on the most expensive accounts, and review spending weekly.",
        };
  const ratioGoalMessage =
    debtToIncomePercent > 36
      ? "Aim to fall below 36% to satisfy most lenders, then keep pushing toward 25% for a standout profile."
      : debtToIncomePercent > 25
      ? "You're inside lender comfort zones—drift below 25% to reach the excellent range."
      : "Maintain the excellence and experiment with nudging the ratio toward 20% for extra resilience.";
  const monthlyIncomeForRule = Math.max(0, monthlyIncome);
  const ruleAllocations = useMemo(
    () =>
      [
        {
          label: "Spend 50% on Essentials",
          percent: 50,
          amount: monthlyIncomeForRule * 0.5,
          color: "bg-emerald-300/80",
          dotColor: "bg-emerald-200",
        },
        {
          label: "Spend 30% on Lifestyle",
          percent: 30,
          amount: monthlyIncomeForRule * 0.3,
          color: "bg-indigo-300/80",
          dotColor: "bg-indigo-200",
        },
        {
          label: "Put 20% into savings account",
          percent: 20,
          amount: monthlyIncomeForRule * 0.2,
          color: "bg-sky-300/80",
          dotColor: "bg-sky-200",
        },
      ],
    [monthlyIncomeForRule]
  );

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
              <div className={`flex items-baseline gap-2 rounded-2xl px-4 py-2 ${scoreBackground}`}>
                <span className={`text-5xl font-black leading-none ${scoreTone}`}>{score}</span>
                <span className="text-sm font-semibold text-white/70">/100</span>
              </div>
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {label}
                </span>
                <p className="max-w-xs text-sm text-white/80">{summary}</p>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className={`h-full rounded-full ${score >= 75 ? "bg-emerald-200" : score >= 50 ? "bg-amber-200" : "bg-rose-200"}`}
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
          <div
            className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
            data-tour-id="financial-wellness-dti"
          >
            <p className="text-xs uppercase tracking-wide text-white/70">Debt-to-income</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className={`text-lg font-semibold ${debtTone}`}>
                {debtToIncomePercent.toFixed(1)}%
              </p>
              <span className="text-xs uppercase tracking-wide text-white/60">of income</span>
            </div>
            <p className="mt-1 text-xs text-white/60">≈ {formattedDebtRatio} debt : income</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm text-white/80 md:grid-cols-2">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">Debt-to-income focus</p>
            <p className="mt-2 text-base font-semibold text-white">{debtStatus.label}</p>
            <p className="mt-2 text-sm text-white/80">{driverMessage}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full bg-white/10 px-3 py-1">
                Current: {debtToIncomePercent.toFixed(1)}% · ≈ {formattedDebtRatio}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                Excellent ≤25% • Good 25-35% • Lenders prefer ≤36%
              </span>
            </div>
            <p className="mt-3 text-sm text-white/80">{ratioGoalMessage}</p>
            <p className="mt-2 text-sm text-white/80">{debtStatus.action}</p>
          </div>
          <div
            className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
            data-tour-id="financial-wellness-rule"
          >
            <p className="text-xs uppercase tracking-wide text-white/70">50/30/20 rule</p>
            {monthlyIncomeForRule > 0 ? (
              <>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/15">
                  {ruleAllocations.map((segment) => (
                    <div
                      key={segment.label}
                      className={`h-full ${segment.color}`}
                      style={{ width: `${segment.percent}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {ruleAllocations.map((segment) => (
                    <div
                      key={segment.label}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-white"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${segment.dotColor}`} />
                        <span className="font-medium">{segment.label}</span>
                      </div>
                      <span className="text-sm text-white/80">
                        {segment.percent}% · {formatCurrency(segment.amount, region)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/75">
                We'll generate your 50/30/20 split once a full month of income activity is available.
              </p>
            )}
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
