import type { Account, Transaction, User } from "../types";

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
  cleanData: Record<string, unknown>;
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

export async function fetchFinancialAnalysis(
  payload: FinancialAnalysisRequest
): Promise<FinancialAnalysisResponse> {
  const response = await fetch("/api/analyze-finances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as any;

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch financial analysis");
  }

  // Safety defaults (keeps UI stable even if OpenAI returns partial fields)
  const safe: FinancialAnalysisResponse = {
    cleanData: data?.cleanData ?? {},
    analysis: {
      insights: Array.isArray(data?.analysis?.insights) ? data.analysis.insights : [],
      alerts: Array.isArray(data?.analysis?.alerts) ? data.analysis.alerts : [],
      forecast: data?.analysis?.forecast ?? { forecastData: [], insight: "", keyChanges: [] },
      subscriptions: Array.isArray(data?.analysis?.subscriptions) ? data.analysis.subscriptions : [],
      weeklyOrders: Array.isArray(data?.analysis?.weeklyOrders) ? data.analysis.weeklyOrders : [],
      disclaimer: typeof data?.analysis?.disclaimer === "string" ? data.analysis.disclaimer : "This is not financial advice.",
    },
    cached: Boolean(data?.cached),
    generatedAt: typeof data?.generatedAt === "string" ? data.generatedAt : new Date().toISOString(),
  };

  return safe;
}
