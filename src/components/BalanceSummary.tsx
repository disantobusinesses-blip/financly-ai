import { Account } from "../types";

interface BalanceSummaryProps {
  accounts: Account[];
}

export default function BalanceSummary({ accounts }: BalanceSummaryProps) {
  const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="p-4 rounded-lg border bg-content-bg">
      <h2 className="text-lg font-bold text-text-primary">Balance Summary</h2>
      <p className="text-2xl font-bold text-primary mt-2">
        {total.toLocaleString("en-AU", { style: "currency", currency: "AUD" })}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-text-secondary">
        {accounts.map((acc) => (
          <li key={acc.id}>
            {acc.name} — {acc.balance.toLocaleString("en-AU", { style: "currency", currency: acc.currency })}
          </li>
        ))}
      </ul>
    </div>
  );
}
