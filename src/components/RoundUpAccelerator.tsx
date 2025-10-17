import { useMemo } from "react";
import Card from "./Card";
import { Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import { PiggyBankIcon } from "./icon/Icon";

interface RoundUpAcceleratorProps {
  transactions: Transaction[];
}

const isEligiblePurchase = (transaction: Transaction) => {
  if (transaction.amount >= 0) return false;
  const excludedCategories = new Set([
    "Transfers",
    "Savings",
    "Debt Repayments",
    "Mortgage",
    "Loan",
    "Investment",
  ]);
  return !excludedCategories.has(transaction.category ?? "");
};

export default function RoundUpAccelerator({
  transactions,
}: RoundUpAcceleratorProps) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const { potentialMonthlyRoundUps, averagePerTransaction, eligibleCount } = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime());
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const eligible = transactions.filter((txn) => {
      const date = new Date(txn.date);
      return (
        isEligiblePurchase(txn) &&
        !Number.isNaN(date.getTime()) &&
        date >= thirtyDaysAgo &&
        date <= now
      );
    });

    const roundUpTotal = eligible.reduce((sum, txn) => {
      const spend = Math.abs(txn.amount);
      const roundTarget = Math.ceil(spend / 5) * 5;
      return sum + (roundTarget - spend);
    }, 0);

    const average = eligible.length > 0 ? roundUpTotal / eligible.length : 0;

    return {
      potentialMonthlyRoundUps: roundUpTotal,
      averagePerTransaction: average,
      eligibleCount: eligible.length,
    };
  }, [transactions]);

  return (
    <Card
      title="Round-up accelerator"
      subtitle="Skim spare change from card purchases and auto-route it to savings."
      icon={<PiggyBankIcon className="h-6 w-6" />}
      insights={[
        {
          label: "Eligible swipes",
          value: String(eligibleCount),
        },
        {
          label: "Round-ups",
          value: formatCurrency(potentialMonthlyRoundUps, region),
          tone: potentialMonthlyRoundUps > 0 ? "positive" : "neutral",
        },
        {
          label: "Per swipe",
          value: formatCurrency(averagePerTransaction, region),
        },
      ]}
    >
      {eligibleCount === 0 ? (
        <p className="text-sm text-slate-500">
          Use your everyday card this month to unlock automatic round-up savings.
        </p>
      ) : (
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="font-semibold text-slate-900">Auto-transfer schedule</p>
            <p className="mt-1 text-xs text-slate-500">
              Sweep round-ups to savings every Friday to stay consistent without
              feeling the pinch.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="font-semibold text-slate-900">Boost challenge</p>
            <p className="mt-1 text-xs text-slate-500">
              Match your round-up total once a month for an instant 2x savings boost.
            </p>
          </li>
        </ul>
      )}
    </Card>
  );
}
