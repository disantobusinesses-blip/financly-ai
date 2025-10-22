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

/** Simple goal data used in Goal UI */
export interface Goal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date
}

/** Simple savings plan list shown in demo cards */
export interface SavingsPlan {
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
}

/** Advanced AI optimization plan used by AISavingsPlan + SpendingForecast */
export interface SavingsOptimizationPlan {
  suggestions: { category: string; monthlyCut: number; description: string }[];
  totalMonthlySavings: number;
  newGoalDate: string; // ISO date
  monthsSaved: number;
}

/** Alerts */
export type FinancialAlertType = "Anomaly" | "Opportunity" | "Milestone";
export interface FinancialAlert {
  type: FinancialAlertType;
  title: string;
  description: string;
}

/** Forecast outputs */
export interface SpendingForecastResult {
  forecastData: { name: string; Forecast: number }[];
  insight: string;
}

/** AI-enhanced financial forecast results (includes disclaimer) */
export interface BalanceForecastResult {
  forecastData: {
    month: string;
    defaultForecast: number;
    optimizedForecast: number;
  }[];
  insight: string;
  keyChanges: { description: string }[];
  disclaimer?: string; // ✅ added for AI disclaimer compatibility
}

/** User */
export type UserMembershipType = "Free" | "Pro";
export interface User {
  id: string;
  email: string;
  membershipType: UserMembershipType;
  region: "AU" | "US";
}