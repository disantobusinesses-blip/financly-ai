

export enum AccountType {
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  CREDIT_CARD = 'Credit Card',
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

export type FinancialAlertType = 'Anomaly' | 'Opportunity' | 'Milestone';

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

export interface SavingsPlan {
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
    forecastData: { month: string; defaultForecast: number; optimizedForecast: number }[];
    insight: string;
    keyChanges: { description: string }[];
}

export type UserMembershipType = 'Free' | 'Pro';

export interface User {
  id: string;
  email: string;
  membershipType: UserMembershipType;
  region: 'AU' | 'US';
}

// FIX: Add missing types for AI Investment Advisor
export type RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive';

export interface InvestmentAdvice {
    allocation: {
        name: string;
        percentage: number;
    }[];
    rationale: string;
}
