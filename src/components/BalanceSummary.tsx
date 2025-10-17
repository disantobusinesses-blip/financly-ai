import { useMemo } from "react";
import { Account, AccountType } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

const GROUP_LABELS: Record<AccountType, string> = {
  [AccountType.CHECKING]: "Everyday Accounts",
  [AccountType.SAVINGS]: "Savings & Goals",
  [AccountType.CREDIT_CARD]: "Credit Cards",
  [AccountType.LOAN]: "Loans & Liabilities",
};

const TYPE_ORDER = [
  AccountType.CHECKING,
  AccountType.SAVINGS,
  AccountType.CREDIT_CARD,
  AccountType.LOAN,
];

interface BalanceSummaryProps {
  accounts: Account[];
}

const toAmount = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function BalanceSummary({ accounts }: BalanceSummaryProps) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const normalisedAccounts = useMemo(
    () =>
      accounts.map((account) => ({
        ...account,
        balance: toAmount(account.balance),
      })),
    [accounts]
  );

  const netWorth = useMemo(
    () => normalisedAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    [normalisedAccounts]
  );

  const grouped = useMemo(() => {
    const sorted = [...normalisedAccounts].sort(
      (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
    );

    const lookup = new Map<
      AccountType,
      { label: string; total: number; accounts: Account[] }
    >();

    sorted.forEach((account) => {
      const bucket = lookup.get(account.type);
      if (bucket) {
        bucket.accounts.push(account);
        bucket.total += account.balance;
      } else {
        lookup.set(account.type, {
          label: GROUP_LABELS[account.type] ?? account.type,
          total: account.balance,
          accounts: [account],
        });
      }
    });

    return TYPE_ORDER.filter((type) => lookup.has(type)).map((type) =>
      lookup.get(type)!
    );
  }, [normalisedAccounts]);

  return (
    <div className="p-4 rounded-lg border bg-content-bg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Balance Summary</h2>
        <span className="text-xs text-text-secondary">
          {normalisedAccounts.length} linked account
          {normalisedAccounts.length === 1 ? "" : "s"}
        </span>
      </div>

      <p className="text-3xl font-bold text-primary mt-2">
        {formatCurrency(netWorth, region)}
      </p>

      <div className="mt-4 space-y-4">
        {grouped.map((group) => (
          <div key={group.label}>
            <div className="flex items-center justify-between text-sm font-semibold text-text-primary">
              <span>{group.label}</span>
              <span>{formatCurrency(group.total, region)}</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-text-secondary">
              {group.accounts.map((acc) => {
                const amountClass =
                  acc.balance < 0 ? "text-red-500" : "text-emerald-500";
                return (
                  <li key={acc.id} className="flex items-center justify-between">
                    <span className="truncate pr-2">{acc.name}</span>
                    <span className={`font-medium ${amountClass}`}>
                      {formatCurrency(acc.balance, region, acc.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
