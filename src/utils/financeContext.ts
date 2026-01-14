import type { Account, Transaction } from "../types";

type Cadence = "weekly" | "biweekly" | "monthly";

type RecurringCandidate = {
  merchant: string;
  cadence: Cadence;
  averageAmount: number;
  lastDate: string;
  occurrences: number;
};

type MerchantTotal = {
  merchant: string;
  total: number;
};

type DuplicateTransaction = {
  merchant: string;
  amount: number;
  dates: string[];
};

type FinanceContext = {
  region: string;
  lastUpdated: string;
  totals: {
    income30d: number;
    outgoings30d: number;
    net30d: number;
  };
  topMerchants: MerchantTotal[];
  categoryRollup: Record<string, number>;
  recurringCandidates: RecurringCandidate[];
  duplicates: DuplicateTransaction[];
  transactions: Transaction[];
  accountCount: number;
  accounts: { id: string; name: string; balance: number; currency: string }[];
};

const normalizeMerchant = (value: string) => value.trim().toLowerCase();

const getMerchantName = (transaction: Transaction) =>
  transaction.description?.trim() || transaction.category?.trim() || "Unknown";

const toAmount = (amount: number) => Number(amount.toFixed(2));

const daysBetween = (a: Date, b: Date) =>
  Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

const getCadence = (diff: number): Cadence | null => {
  if (diff >= 5 && diff <= 9) return "weekly";
  if (diff >= 12 && diff <= 18) return "biweekly";
  if (diff >= 25 && diff <= 35) return "monthly";
  return null;
};

export const buildFinanceContext = (
  accounts: Account[],
  transactions: Transaction[],
  region = "AU",
  lastUpdated?: string
): FinanceContext => {
  const sortedTransactions = [...transactions]
    .filter((tx) => Boolean(tx?.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 80);

  const now = new Date();
  const start30d = new Date(now);
  start30d.setDate(start30d.getDate() - 30);

  const recentTransactions = sortedTransactions.filter((tx) => {
    const date = new Date(tx.date);
    return !Number.isNaN(date.getTime()) && date >= start30d;
  });

  const income30d = recentTransactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const outgoings30d = Math.abs(
    recentTransactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  const categoryRollup = recentTransactions.reduce<Record<string, number>>((acc, tx) => {
    if (tx.amount >= 0) return acc;
    const key = tx.category || "Other";
    acc[key] = toAmount((acc[key] || 0) + Math.abs(tx.amount));
    return acc;
  }, {});

  const merchantTotals = recentTransactions.reduce<Record<string, number>>((acc, tx) => {
    if (tx.amount >= 0) return acc;
    const merchant = getMerchantName(tx);
    acc[merchant] = toAmount((acc[merchant] || 0) + Math.abs(tx.amount));
    return acc;
  }, {});

  const topMerchants = Object.entries(merchantTotals)
    .map(([merchant, total]) => ({ merchant, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const recurringMap = sortedTransactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (tx.amount >= 0) return acc;
    const merchant = normalizeMerchant(getMerchantName(tx));
    acc[merchant] = acc[merchant] || [];
    acc[merchant].push(tx);
    return acc;
  }, {});

  const recurringCandidates = Object.entries(recurringMap)
    .map(([merchant, items]) => {
      const ordered = items
        .filter((tx) => !Number.isNaN(new Date(tx.date).getTime()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (ordered.length < 3) return null;

      const diffs = ordered.slice(1).map((tx, idx) => {
        const prev = ordered[idx];
        return daysBetween(new Date(tx.date), new Date(prev.date));
      });

      const avgDiff = diffs.reduce((sum, value) => sum + value, 0) / diffs.length;
      const cadence = getCadence(avgDiff);
      if (!cadence) return null;

      const averageAmount =
        ordered.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / ordered.length;

      const last = ordered[ordered.length - 1];
      return {
        merchant,
        cadence,
        averageAmount: toAmount(averageAmount),
        lastDate: last.date,
        occurrences: ordered.length,
      };
    })
    .filter((value): value is RecurringCandidate => Boolean(value));

  const duplicatesMap = new Map<string, string[]>();
  sortedTransactions.forEach((tx) => {
    const merchant = normalizeMerchant(getMerchantName(tx));
    const amountKey = toAmount(Math.abs(tx.amount));
    const key = `${merchant}|${amountKey}`;
    const dates = duplicatesMap.get(key) || [];
    dates.push(tx.date);
    duplicatesMap.set(key, dates);
  });

  const duplicates: DuplicateTransaction[] = [];
  duplicatesMap.forEach((dates, key) => {
    if (dates.length < 2) return;
    const sortedDates = dates
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    for (let i = 1; i < sortedDates.length; i += 1) {
      const gap = daysBetween(sortedDates[i], sortedDates[i - 1]);
      if (gap <= 2) {
        const [merchant, amountString] = key.split("|");
        duplicates.push({
          merchant,
          amount: Number(amountString),
          dates: sortedDates.map((date) => date.toISOString()),
        });
        break;
      }
    }
  });

  return {
    region,
    lastUpdated: lastUpdated || new Date().toISOString(),
    totals: {
      income30d: toAmount(income30d),
      outgoings30d: toAmount(outgoings30d),
      net30d: toAmount(income30d - outgoings30d),
    },
    topMerchants,
    categoryRollup,
    recurringCandidates,
    duplicates,
    transactions: sortedTransactions,
    accountCount: accounts.length,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      balance: toAmount(account.balance),
      currency: account.currency,
    })),
  };
};

export type { FinanceContext };
