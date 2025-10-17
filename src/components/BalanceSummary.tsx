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

  const { spendingAvailable, mortgageTotal, savingsTotal, debtObligations } = useMemo(() => {
    const mortgageMatcher = /mortgage|home loan|home-loan|property/i;
    return normalisedAccounts.reduce(
      (acc, account) => {
        const balance = account.balance;
        const isMortgage =
          account.type === AccountType.LOAN && mortgageMatcher.test(account.name);

        if (balance > 0 && account.type !== AccountType.CREDIT_CARD) {
          acc.spendingAvailable += balance;
        }

        if (account.type === AccountType.SAVINGS && balance > 0) {
          acc.savingsTotal += balance;
        }

        if (balance < 0) {
          acc.debtObligations += Math.abs(balance);
        }

        if (isMortgage) {
          acc.mortgageTotal += Math.abs(balance);
        }

        return acc;
      },
      {
        spendingAvailable: 0,
        mortgageTotal: 0,
        savingsTotal: 0,
        debtObligations: 0,
      }
    );
  }, [normalisedAccounts]);

  const hasMortgage = mortgageTotal > 0;

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

  const topAccount = useMemo(() => {
    const sorted = [...normalisedAccounts].sort((a, b) => b.balance - a.balance);
    return sorted[0];
  }, [normalisedAccounts]);

  const insightChips = [
    hasMortgage
      ? `Mortgage balance ${formatCurrency(-Math.abs(mortgageTotal), region)}`
      : `Savings ${formatCurrency(savingsTotal, region)}`,
    `Debt obligations ${formatCurrency(-Math.abs(debtObligations), region)}`,
    topAccount
      ? `Top account ${topAccount.name}`
      : `${normalisedAccounts.length} linked account${
          normalisedAccounts.length === 1 ? "" : "s"
        }`,
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-indigo-900 text-white shadow-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-60 w-60 rounded-full bg-indigo-400/20 blur-2xl"
      />
      <div className="relative space-y-6 p-6 md:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Balance summary
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">{formatCurrency(netWorth, region)}</h2>
            <p className="mt-2 text-sm text-white/70">
              {normalisedAccounts.length} linked account
              {normalisedAccounts.length === 1 ? "" : "s"} tracked in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {insightChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              >
                {chip}
              </span>
            ))}
          </div>
        </header>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white/15 p-4">
            <dt className="text-xs uppercase tracking-wide text-white/70">
              {hasMortgage ? "Spending available" : "Liquid funds"}
            </dt>
            <dd className="mt-1 text-2xl font-semibold">
              {formatCurrency(spendingAvailable || 0, region)}
            </dd>
            <p className="mt-2 text-xs text-white/70">
              Everyday cash ready to deploy across your goals.
            </p>
          </div>
          <div className="rounded-xl bg-white/15 p-4">
            <dt className="text-xs uppercase tracking-wide text-white/70">
              Total net worth
            </dt>
            <dd className="mt-1 text-2xl font-semibold">
              {formatCurrency(netWorth, region)}
            </dd>
            <p className="mt-2 text-xs text-white/70">
              Includes savings, investments, mortgages and debts.
            </p>
          </div>
          {hasMortgage ? (
            <div className="rounded-xl bg-white/15 p-4">
              <dt className="text-xs uppercase tracking-wide text-white/70">
                Mortgage balance
              </dt>
              <dd className="mt-1 text-2xl font-semibold">
                {formatCurrency(-Math.abs(mortgageTotal), region)}
              </dd>
              <p className="mt-2 text-xs text-white/70">
                Factor this into accelerated repayments to save interest.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white/15 p-4">
              <dt className="text-xs uppercase tracking-wide text-white/70">
                Savings total
              </dt>
              <dd className="mt-1 text-2xl font-semibold">
                {formatCurrency(savingsTotal, region)}
              </dd>
              <p className="mt-2 text-xs text-white/70">
                Keep at least three months of spending in reserve.
              </p>
            </div>
          )}
        </dl>

        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map((group) => (
            <div key={group.label} className="rounded-2xl bg-white/10 p-4 text-sm">
              <div className="flex items-center justify-between font-semibold text-white">
                <span>{group.label}</span>
                <span>{formatCurrency(group.total, region)}</span>
              </div>
              <ul className="mt-3 space-y-2 text-white/80">
                {group.accounts.map((acc) => {
                  const amountClass =
                    acc.balance < 0 ? "text-rose-300" : "text-emerald-200";
                  return (
                    <li key={acc.id} className="flex items-center justify-between">
                      <span className="truncate pr-2">{acc.name}</span>
                      <span className={`font-semibold ${amountClass}`}>
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
    </section>
  );
}
