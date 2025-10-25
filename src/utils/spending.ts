import { Transaction } from "../types";

export type BudgetCategory = "Essentials" | "Lifestyle" | "Savings";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const ESSENTIAL_KEYWORDS = [
  "rent",
  "mortgage",
  "utility",
  "electric",
  "gas",
  "water",
  "insurance",
  "premium",
  "woolworth",
  "coles",
  "aldi",
  "iga",
  "supermarket",
  "grocery",
  "petrol",
  "fuel",
  "7-eleven",
  "7 eleven",
  "bp",
  "caltex",
  "shell",
  "ampol",
  "transport",
  "train",
  "tram",
  "bus",
  "opal",
  "myki",
  "mygo",
  "child care",
  "daycare",
  "school",
  "education",
  "medical",
  "doctor",
  "hospital",
  "pharmacy",
  "chemist",
  "loan",
  "repayment",
  "debt",
  "credit card",
  "amortisation",
  "council",
  "rate",
  "tax",
  "registration",
  "internet",
  "phone",
  "mobile",
  "telstra",
  "optus",
  "vodafone",
  "energy",
  "origin",
  "agl",
  "energy australia",
  "woolies",
  "coles online",
  "bp petrol",
  "servo",
];

const LIFESTYLE_KEYWORDS = [
  "restaurant",
  "dining",
  "cafe",
  "coffee",
  "bar",
  "pub",
  "takeaway",
  "take away",
  "uber eats",
  "deliveroo",
  "doordash",
  "netflix",
  "spotify",
  "stan",
  "disney",
  "prime video",
  "youtube",
  "apple music",
  "itunes",
  "google play",
  "amazon",
  "ebay",
  "kmart",
  "target",
  "myer",
  "sephora",
  "mecca",
  "beauty",
  "salon",
  "spa",
  "gym",
  "fitness",
  "membership",
  "cinema",
  "movie",
  "ticket",
  "entertainment",
  "holiday",
  "travel",
  "hotel",
  "airbnb",
  "flight",
  "uber",
  "lyft",
  "ride share",
  "gaming",
  "playstation",
  "xbox",
  "switch",
  "steam",
  "binge",
  "foxtel",
  "league pass",
];

const SAVINGS_KEYWORDS = [
  "savings",
  "investment",
  "invest",
  "micro-invest",
  "micro invest",
  "microinvest",
  "round up",
  "round-up",
  "deposit savings",
  "transfer to savings",
  "offset",
  "top up",
  "top-up",
  "stash",
  "raiz",
  "acorns",
  "stake",
  "etoro",
  "sharesies",
  "super",
  "401k",
  "retirement",
  "term deposit",
];

const TARGET_SPLIT: Record<BudgetCategory, number> = {
  Essentials: 50,
  Lifestyle: 30,
  Savings: 20,
};

const matchKeyword = (descriptor: string, keywords: string[]) =>
  keywords.some((keyword) => descriptor.includes(keyword));

export const BUDGET_CATEGORIES: BudgetCategory[] = ["Essentials", "Lifestyle", "Savings"];

export interface BudgetSummary {
  income: number;
  totals: Record<BudgetCategory, number>;
  percentages: Record<BudgetCategory, number>;
  targetPercentages: Record<BudgetCategory, number>;
  targetAmounts: Record<BudgetCategory, number>;
  adjustments: Record<BudgetCategory, number>;
  savingsAllocated: number;
  expenses: number;
  totalOutflow: number;
  windowTransactions: Transaction[];
}

export const classifyTransaction = (transaction: Transaction): BudgetCategory | null => {
  const descriptor = `${transaction.description} ${transaction.category}`.toLowerCase();

  if (transaction.amount >= 0) {
    return null;
  }

  if (matchKeyword(descriptor, SAVINGS_KEYWORDS)) {
    return "Savings";
  }

  if (matchKeyword(descriptor, ESSENTIAL_KEYWORDS)) {
    return "Essentials";
  }

  if (matchKeyword(descriptor, LIFESTYLE_KEYWORDS)) {
    return "Lifestyle";
  }

  if (descriptor.includes("loan") || descriptor.includes("repay") || descriptor.includes("debt")) {
    return "Essentials";
  }

  if (descriptor.includes("subscription") || descriptor.includes("membership")) {
    return "Lifestyle";
  }

  return "Essentials";
};

export const summariseMonthlyBudget = (transactions: Transaction[]): BudgetSummary => {
  const startTime = Date.now() - THIRTY_DAYS_MS;

  let income = 0;
  const totals: Record<BudgetCategory, number> = {
    Essentials: 0,
    Lifestyle: 0,
    Savings: 0,
  };
  const windowTransactions: Transaction[] = [];

  transactions.forEach((transaction) => {
    const txTime = new Date(transaction.date).getTime();
    if (Number.isNaN(txTime) || txTime < startTime) {
      return;
    }

    windowTransactions.push(transaction);
    const amount = Number(transaction.amount) || 0;

    if (amount > 0) {
      income += amount;
      return;
    }

    if (amount < 0) {
      const classification = classifyTransaction(transaction);
      if (classification) {
        totals[classification] += Math.abs(amount);
      }
    }
  });

  const percentages = BUDGET_CATEGORIES.reduce((acc, category) => {
    const pct = income > 0 ? (totals[category] / income) * 100 : 0;
    acc[category] = pct;
    return acc;
  }, {} as Record<BudgetCategory, number>);

  const targetAmounts = BUDGET_CATEGORIES.reduce((acc, category) => {
    acc[category] = (TARGET_SPLIT[category] / 100) * income;
    return acc;
  }, {} as Record<BudgetCategory, number>);

  const adjustments = BUDGET_CATEGORIES.reduce((acc, category) => {
    acc[category] = percentages[category] - TARGET_SPLIT[category];
    return acc;
  }, {} as Record<BudgetCategory, number>);

  const expenses = totals.Essentials + totals.Lifestyle;
  const totalOutflow = totals.Essentials + totals.Lifestyle + totals.Savings;
  const surplus = Math.max(0, income - totalOutflow);
  const savingsAllocated = totals.Savings + surplus;

  return {
    income,
    totals,
    percentages,
    targetPercentages: TARGET_SPLIT,
    targetAmounts,
    adjustments,
    savingsAllocated,
    expenses,
    totalOutflow,
    windowTransactions,
  };
};

