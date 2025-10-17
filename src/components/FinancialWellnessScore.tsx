import { useMemo } from "react";
import Card from "./Card";
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
    const totals = accounts.reduce(
      (acc, account) => {
        if (account.balance >= 0) {
          acc.assets += account.balance;
        } else {
          acc.liabilities += Math.abs(account.balance);
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

    const income = recent.reduce(
      (sum, txn) => (txn.amount > 0 ? sum + txn.amount : sum),
      0
    );
    const expenses = recent.reduce(
      (sum, txn) => (txn.amount < 0 ? sum + Math.abs(txn.amount) : sum),
      0
    );

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
      if (txn.amount < 0) {
        const category = txn.category || "General Spending";
        spendingByCategory[category] =
          (spendingByCategory[category] || 0) + Math.abs(txn.amount);
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
  const debtToIncomePercent = Math.min(999, Math.round(debtToIncome * 100));

  return (
    <Card title="Financial Wellness Score">
      <div className="space-y-4">
        <div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-primary">{score}</span>
            <span className="text-xs uppercase tracking-wide text-text-secondary">
              {label}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">{summary}</p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
            <div
              className="h-2 bg-primary rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-secondary">Net Worth</p>
            <p className="font-semibold text-text-primary">
              {formatCurrency(netWorth, region)}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">30-day Income</p>
            <p className="font-semibold text-text-primary">
              {formatCurrency(monthlyIncome, region)}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">30-day Spend</p>
            <p className="font-semibold text-text-primary">
              {formatCurrency(-Math.abs(monthlyExpenses), region)}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Savings Rate</p>
            <p className="font-semibold text-text-primary">
              {savingsRatePercent}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-secondary">
          <p>
            Assets {formatCurrency(assets, region)} · Liabilities
            {" "}
            {formatCurrency(-Math.abs(liabilities), region)}
          </p>
          <p>
            Debt-to-income ratio {debtToIncomePercent}%
          </p>
        </div>

        {topSpendingCategory && topSpendingAmount > 0 && (
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-sm">
            <p className="font-semibold text-text-primary">
              Biggest opportunity: {topSpendingCategory}
            </p>
            <p className="text-text-secondary">
              You've spent {formatCurrency(-Math.abs(topSpendingAmount), region)} in the
              last 30 days. Consider setting a soft cap next month.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
