export enum AccountType {
  CHECKING = "Checking",
  SAVINGS = "Savings",
  CREDIT_CARD = "Credit Card",
  LOAN = "Loan",
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface SpendingCategory {
  name: string;
  value: number;
}

export type FinancialAlertType = "Anomaly" | "Opportunity" | "Milestone";

export interface FinancialAlert {
  type: FinancialAlertType;
  title: string;
  description: string;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

/**
 * Simple savings plan for demo data (Dashboard.tsx expects these fields)
 */
export interface SavingsPlan {
  name: string;                // ✅ added
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
}

/**
 * Advanced AI-generated savings optimization plan (keep for your AI features)
 */
export interface SavingsOptimizationPlan {
  suggestions: {
    category: string;
    monthlyCut: number;
    description: string;
  }[];
  totalMonthlySavings: number;
  newGoalDate: string;
  monthsSaved: number;
}

export interface SpendingForecastResult {
  forecastData: { name: string; Forecast: number }[];
  insight: string;
}

export interface BalanceForecastResult {
  forecastData: {
    month: string;
    defaultForecast: number;
    optimizedForecast: number;
  }[];
  insight: string;
  keyChanges: { description: string }[];
}

export type UserMembershipType = "Free" | "Pro";

export interface User {
  id: string;
  email: string;
  membershipType: UserMembershipType;
  region: "AU" | "US";
}
