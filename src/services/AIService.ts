import { BalanceForecastResult, Transaction, User } from "../types";

export interface TransactionAnalysisResult {
  insights: { emoji: string; text: string }[];
  subscriptions: {
    name: string;
    amount: number;
    cancellationUrl: string;
  }[];
  disclaimer?: string;
}

export interface BorrowingPowerResult {
  estimatedLoanAmount: number;
  estimatedInterestRate: number;
  advice: string;
  disclaimer?: string;
}

export interface FinancialAlertWithDisclaimer {
  type: string;
  title: string;
  description: string;
  disclaimer?: string;
}

const API_ROUTE = "/api/ai";

async function postToAI<T>(action: string, payload: unknown): Promise<T> {
  const response = await fetch(API_ROUTE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `AI request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getTransactionInsights(
  transactions: Transaction[],
  region: User["region"]
): Promise<TransactionAnalysisResult> {
  return postToAI<TransactionAnalysisResult>("transaction-insights", {
    transactions,
    region,
  });
}

export function getBorrowingPower(
  creditScore: number,
  totalIncome: number,
  totalBalance: number,
  region: User["region"]
): Promise<BorrowingPowerResult> {
  return postToAI<BorrowingPowerResult>("borrowing-power", {
    creditScore,
    totalIncome,
    totalBalance,
    region,
  });
}

export function getFinancialAlerts(
  transactions: Transaction[],
  region: User["region"]
): Promise<FinancialAlertWithDisclaimer[]> {
  return postToAI<FinancialAlertWithDisclaimer[]>("financial-alerts", {
    transactions,
    region,
  });
}

export function getBalanceForecast(
  transactions: Transaction[],
  currentBalance: number,
  potentialMonthlySavings: number,
  region: User["region"]
): Promise<BalanceForecastResult> {
  return postToAI<BalanceForecastResult>("balance-forecast", {
    transactions,
    currentBalance,
    potentialMonthlySavings,
    region,
  });
}
