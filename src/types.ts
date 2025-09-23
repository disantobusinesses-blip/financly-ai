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

/** Simple savings goal used by demo */
export interface SavingsPlan {
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
}

/** Advanced, AI-generated optimization plan */
export interface SavingsOptimizationPlan {
  suggestions: { category: string; monthlyCut: number; description: string }[];
  totalMonthlySavings: number;
  newGoalDate: string;
  monthsSaved: number;
}

export interface SpendingForecastResult {
  forecastData: { name: string; Forecast: number }[];
  insight: string;
}

export interface BalanceForecastResult {
  forecastData: { month: string; defaultForecast: number; optimizedForecast: number }[];
  insight: string;
  keyChanges: { description: string }[];
}

export type UserMembershipType = "Free" | "Pro";
export interface User { id: string; email: string; membershipType: UserMembershipType; region: "AU" | "US"; }
