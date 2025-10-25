import { Account, AccountType, Transaction } from "../types";
import { BUDGET_CATEGORIES, BudgetSummary, summariseMonthlyBudget } from "./spending";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const roundToCents = (value: number) => Math.round(value * 100) / 100;

const DEBT_KEYWORDS = [
  "loan",
  "mortgage",
  "credit",
  "repayment",
  "debt",
  "card",
  "interest",
  "finance",
  "lender",
];

export interface AccountWithComputed extends Account {
  computedBalance: number;
  isLiability: boolean;
}

export interface AccountOverview {
  spendingAvailable: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accounts: AccountWithComputed[];
  mortgageAccounts: AccountWithComputed[];
}

const normaliseBalance = (account: Account): number => {
  let balance = Number(account.balance) || 0;
  if ((account.type === AccountType.CREDIT_CARD || account.type === AccountType.LOAN) && balance > 0) {
    balance = -Math.abs(balance);
  }
  return roundToCents(balance);
};

export const computeAccountOverview = (accounts: Account[]): AccountOverview => {
  const enhanced: AccountWithComputed[] = accounts.map((account) => {
    const computedBalance = normaliseBalance(account);
    const isLiability = computedBalance < 0;
    return {
      ...account,
      computedBalance,
      isLiability,
    };
  });

  const spendingAccounts = enhanced.filter((account) =>
    account.type === AccountType.CHECKING || account.type === AccountType.SAVINGS
  );
  const spendingAvailable = roundToCents(
    spendingAccounts.reduce((total, account) => total + Math.max(0, account.computedBalance), 0)
  );

  const totalAssets = roundToCents(
    enhanced.filter((account) => !account.isLiability).reduce((total, account) => total + account.computedBalance, 0)
  );
  const totalLiabilities = roundToCents(
    enhanced.filter((account) => account.isLiability).reduce((total, account) => total + Math.abs(account.computedBalance), 0)
  );
  const netWorth = roundToCents(totalAssets - totalLiabilities);

  const mortgageAccounts = enhanced.filter((account) => {
    if (!account.isLiability) return false;
    if (account.type === AccountType.LOAN) return true;
    return /mortgage|home loan|loan/i.test(account.name);
  });

  return {
    spendingAvailable,
    totalAssets,
    totalLiabilities,
    netWorth,
    accounts: enhanced,
    mortgageAccounts,
  };
};

const deriveDtiLabel = (dti: number): string => {
  if (dti <= 0.25) return "Excellent";
  if (dti <= 0.35) return "Good";
  if (dti <= 0.5) return "Elevated";
  return "High";
};

const buildFocusMessage = (dti: number): string => {
  if (dti <= 0.25) {
    return "Great trajectory. Keep debt payments under a quarter of income.";
  }
  if (dti <= 0.35) {
    return "Healthy range. Maintain extra cash buffers to stay below 35%.";
  }
  if (dti <= 0.5) {
    return "Above the preferred range. Direct surplus income to the largest balance.";
  }
  return "Debt is consuming over half of monthly income. Prioritise repayments and pause lifestyle upgrades.";
};

const calculateDebtPayments = (
  budget: BudgetSummary,
  accounts: Account[]
): { amount: number; drivers: { name: string; value: number }[] } => {
  const lookup = new Map(accounts.map((account) => [account.id, account]));

  let total = 0;
  const debtByAccount = new Map<string, number>();

  budget.windowTransactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (amount >= 0) return;

    const descriptor = `${transaction.description} ${transaction.category}`.toLowerCase();
    const account = lookup.get(transaction.accountId);
    const isDebtAccount = account
      ? account.type === AccountType.CREDIT_CARD || account.type === AccountType.LOAN || /mortgage|loan/i.test(account.name)
      : false;
    const matchesDebtKeyword = DEBT_KEYWORDS.some((keyword) => descriptor.includes(keyword));

    if (isDebtAccount || matchesDebtKeyword) {
      const payment = Math.abs(amount);
      total += payment;
      if (account) {
        const current = debtByAccount.get(account.name) || 0;
        debtByAccount.set(account.name, current + payment);
      }
    }
  });

  const drivers = Array.from(debtByAccount.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  return { amount: roundToCents(total), drivers };
};

export interface WellnessMetrics {
  score: number;
  dti: number;
  dtiLabel: string;
  focusMessage: string;
  monthlyDebtPayments: number;
  monthlyIncome: number;
  expenses: number;
  netWorth: number;
  savingsAllocated: number;
  essentialsPercent: number;
  lifestylePercent: number;
  savingsPercent: number;
  essentialsAmount: number;
  lifestyleAmount: number;
  savingsAmount: number;
  targetPercentages: Record<(typeof BUDGET_CATEGORIES)[number], number>;
  targetAmounts: Record<(typeof BUDGET_CATEGORIES)[number], number>;
  adjustments: Record<(typeof BUDGET_CATEGORIES)[number], number>;
  liabilitiesByAccount: { name: string; value: number }[];
  componentScores: {
    dti: number;
    savings: number;
    budget: number;
    netWorth: number;
  };
}

export const calculateWellnessMetrics = (
  accounts: Account[],
  transactions: Transaction[]
): WellnessMetrics & { overview: AccountOverview; budget: BudgetSummary } => {
  const overview = computeAccountOverview(accounts);
  const budget = summariseMonthlyBudget(transactions);

  const { amount: monthlyDebtPayments, drivers } = calculateDebtPayments(budget, accounts);
  const monthlyIncome = roundToCents(budget.income);
  const expenses = roundToCents(budget.expenses);
  const savingsAllocated = roundToCents(budget.savingsAllocated);

  const dti = monthlyIncome > 0 ? monthlyDebtPayments / monthlyIncome : 1;
  const dtiScore = clamp((1 - Math.min(dti, 1.2) / 1.2) * 100);

  const savingsRate = monthlyIncome > 0 ? savingsAllocated / monthlyIncome : 0;
  const savingsScore = clamp((savingsRate / 0.2) * 100);

  const averageDeviation =
    BUDGET_CATEGORIES.reduce((total, category) => total + Math.abs(budget.adjustments[category]), 0) /
    BUDGET_CATEGORIES.length;
  const budgetScore = clamp(100 - averageDeviation * 2);

  const netWorthScore = overview.totalAssets > 0
    ? clamp(((overview.netWorth / overview.totalAssets) + 1) * 50)
    : overview.netWorth > 0
    ? 70
    : 40;

  const score = Math.round(0.4 * dtiScore + 0.3 * savingsScore + 0.2 * budgetScore + 0.1 * netWorthScore);

  const dtiLabel = deriveDtiLabel(dti);
  const focusMessage = buildFocusMessage(dti);

  return {
    score,
    dti,
    dtiLabel,
    focusMessage,
    monthlyDebtPayments,
    monthlyIncome,
    expenses,
    netWorth: overview.netWorth,
    savingsAllocated,
    essentialsPercent: budget.percentages.Essentials,
    lifestylePercent: budget.percentages.Lifestyle,
    savingsPercent: budget.percentages.Savings,
    essentialsAmount: roundToCents(budget.totals.Essentials),
    lifestyleAmount: roundToCents(budget.totals.Lifestyle),
    savingsAmount: roundToCents(budget.totals.Savings),
    targetPercentages: budget.targetPercentages,
    targetAmounts: budget.targetAmounts,
    adjustments: budget.adjustments,
    liabilitiesByAccount: drivers,
    componentScores: {
      dti: Math.round(dtiScore),
      savings: Math.round(savingsScore),
      budget: Math.round(budgetScore),
      netWorth: Math.round(netWorthScore),
    },
    overview,
    budget,
  };
};
