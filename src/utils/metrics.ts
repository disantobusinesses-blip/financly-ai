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
  savingsRate: number;
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
  emergencyFundMonths: number;
  liquidAssets: number;
  stabilityRatio: number;
  creditUtilisation: number;
  incomeGrowthRatio: number;
  previousNetWorth: number;
  componentScores: {
    debtToIncome: number;
    savingsRate: number;
    emergencyFund: number;
    netWorth: number;
    stability: number;
    creditUtilisation: number;
    financialBehaviour: number;
    incomeGrowth: number;
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
  const savingsRateScore = clamp((savingsRate / 0.2) * 100);

  const averageDeviation =
    BUDGET_CATEGORIES.reduce((total, category) => total + Math.abs(budget.adjustments[category]), 0) /
    BUDGET_CATEGORIES.length;
  const financialBehaviourScore = clamp(100 - averageDeviation * 2);

  const liquidAssets = overview.accounts
    .filter(
      (account) =>
        !account.isLiability &&
        (account.type === AccountType.CHECKING || account.type === AccountType.SAVINGS)
    )
    .reduce((total, account) => total + account.computedBalance, 0);

  const emergencyFundMonths = expenses > 0 ? liquidAssets / expenses : 6;
  const emergencyFundScore = clamp((Math.min(emergencyFundMonths, 6) / 6) * 100);

  const currentNetChange = monthlyIncome - budget.totalOutflow;

  const previousNetWorth = roundToCents(overview.netWorth - currentNetChange);

  const netWorthScore = overview.totalAssets > 0
    ? clamp(((overview.netWorth / Math.max(overview.totalAssets, 1)) + 1) * 50)
    : overview.netWorth > 0
    ? 70
    : 40;

  const stabilityRatio = monthlyIncome > 0 ? (monthlyIncome - expenses) / monthlyIncome : -1;
  const stabilityScore = clamp((stabilityRatio + 1) * 50);

  const creditBalances = overview.accounts
    .filter((account) => account.type === AccountType.CREDIT_CARD)
    .reduce((total, account) => total + Math.abs(account.computedBalance), 0);
  const creditUtilisation = monthlyIncome > 0 ? creditBalances / (monthlyIncome * 3) : 0;
  const creditUtilizationScore = clamp((1 - Math.min(creditUtilisation, 1)) * 100);

  const windowStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const midPoint = windowStart + 15 * 24 * 60 * 60 * 1000;
  let firstHalfIncome = 0;
  let secondHalfIncome = 0;
  budget.windowTransactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (amount <= 0) return;
    const time = new Date(transaction.date).getTime();
    if (Number.isNaN(time) || time < windowStart) return;
    if (time < midPoint) {
      firstHalfIncome += amount;
    } else {
      secondHalfIncome += amount;
    }
  });
  let incomeGrowthRatio = 0;
  if (firstHalfIncome > 0) {
    incomeGrowthRatio = (secondHalfIncome - firstHalfIncome) / firstHalfIncome;
  } else if (secondHalfIncome > 0) {
    incomeGrowthRatio = 1;
  }
  const incomeGrowthScore = clamp(((incomeGrowthRatio + 1) / 2) * 100);

  const score = Math.round(
    dtiScore * 0.2 +
      savingsRateScore * 0.2 +
      emergencyFundScore * 0.15 +
      netWorthScore * 0.15 +
      stabilityScore * 0.1 +
      creditUtilizationScore * 0.1 +
      financialBehaviourScore * 0.05 +
      incomeGrowthScore * 0.05
  );

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
    savingsRate,
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
    emergencyFundMonths,
    liquidAssets: roundToCents(liquidAssets),
    stabilityRatio,
    creditUtilisation,
    incomeGrowthRatio,
    previousNetWorth,
    componentScores: {
      debtToIncome: Math.round(dtiScore),
      savingsRate: Math.round(savingsRateScore),
      emergencyFund: Math.round(emergencyFundScore),
      netWorth: Math.round(netWorthScore),
      stability: Math.round(stabilityScore),
      creditUtilisation: Math.round(creditUtilizationScore),
      financialBehaviour: Math.round(financialBehaviourScore),
      incomeGrowth: Math.round(incomeGrowthScore),
    },
    overview,
    budget,
  };
};
