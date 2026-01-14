import { Account } from "../types";
import Card from "./Card";

interface UpcomingBillsProps {
  accounts: Account[];
}

export default function UpcomingBills({ accounts }: UpcomingBillsProps) {
  const linkedCount = accounts?.length ?? 0;

  return (
    <Card title="Upcoming Bills">
      <p className="mb-2 text-xs text-text-secondary">
        {linkedCount} linked account{linkedCount === 1 ? "" : "s"}
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        We&apos;ll surface upcoming bills as soon as we detect recurring payments from your linked transactions.
      </div>
    </Card>
  );
}
