import { Account, BalanceForecastResult, Transaction, User } from "../types";

export interface TransactionAnalysisResult {
  insights: { emoji: string; text: string }[];
  subscriptions: {
    name: string;
    amount: number;
    cancellationUrl: string;
  }[];
  disclaimer?: string;
}

export interface FinancialAlertWithDisclaimer {
  type: string;
  title: string;
  description: string;
  disclaimer?: string;
}

export interface FinancialAnalysisCleanData {
  cacheKey: { userId: string; month: number; year: number };
  region: User["region"];
  month: number;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  debtPayments: number;
  debtToIncomeRatio: number;
  wellnessScore: number;
  categoryTotals: Record<string, number>;
  categoryPercentages: Record<string, number>;
  targetPercentages: Record<string, number>;
  netWorth: number;
  accountsCount: number;
  generatedAt: string;
}

export interface FinancialAnalysisResponse {
  cleanData: FinancialAnalysisCleanData;
  analysis: {
    insights: TransactionAnalysisResult["insights"];
    alerts: FinancialAlertWithDisclaimer[];
    forecast: BalanceForecastResult;
    subscriptions: TransactionAnalysisResult["subscriptions"];
    disclaimer: string;
  };
  cached: boolean;
  generatedAt: string;
}

export interface FinancialAnalysisRequest {
  userId: string;
  month: number;
  year: number;
  region: User["region"];
  transactions: Transaction[];
  accounts: Account[];
  totalBalance: number;
  forceRefresh?: boolean;
}

const API_ROUTE = "/api/analyze-finances";

export async function fetchFinancialAnalysis(
  payload: FinancialAnalysisRequest
): Promise<FinancialAnalysisResponse> {
  const response = await fetch(API_ROUTE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `AI request failed with status ${response.status}`);
  }

  return response.json() as Promise<FinancialAnalysisResponse>;
}
