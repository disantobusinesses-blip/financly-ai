import type { Account, Transaction, User } from "../types";

/* ===== Shared Types ===== */

export interface Insight {
  emoji: string;
  text: string;
}

export interface AlertItem {
  type: string;
  title: string;
  description: string;
  disclaimer: string;
}

export interface ForecastEntry {
  month: string;
  defaultForecast: number;
  optimizedForecast: number;
}

export interface ForecastChange {
  description: string;
}

export interface ForecastBlock {
  forecastData: ForecastEntry[];
  insight: string;
  keyChanges: ForecastChange[];
}

export interface SubscriptionItem {
  name: string;
  amount: number;
  cancellationUrl: string;
}

export interface WeeklyOrder {
  title: string;
  why: string;
  impactMonthly: number;
  steps: string[];
}

/* ===== Compatibility Exports (FIXES ERRORS) ===== */

export type TransactionAnalysisResult = FinancialAnalysisResponse;
export type FinancialAnalysisCleanData = Record<string, unknown>;

/* ===== API Request / Response ===== */

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

export interface FinancialAnalysisResponse {
  cleanData: FinancialAnalysisCleanData;
  analysis: {
    insights: Insight[];
    alerts: AlertItem[];
    forecast: ForecastBlock;
    subscriptions: SubscriptionItem[];
    weeklyOrders: WeeklyOrder[];
    disclaimer: string;
  };
  cached: boolean;
  generatedAt: string;
}

/* ===== API Call ===== */

export async function fetchFinancialAnalysis(
  payload: FinancialAnalysisRequest
): Promise<FinancialAnalysisResponse> {
  const response = await fetch("/api/analyze-finances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch financial analysis");
  }

  return {
    cleanData: data.cleanData ?? {},
    analysis: {
      insights: data.analysis?.insights ?? [],
      alerts: data.analysis?.alerts ?? [],
      forecast: data.analysis?.forecast ?? { forecastData: [], insight: "", keyChanges: [] },
      subscriptions: data.analysis?.subscriptions ?? [],
      weeklyOrders: data.analysis?.weeklyOrders ?? [],
      disclaimer: data.analysis?.disclaimer ?? "This is not financial advice.",
    },
    cached: Boolean(data.cached),
    generatedAt: data.generatedAt ?? new Date().toISOString(),
  };
}
