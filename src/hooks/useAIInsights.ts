import { useEffect, useState } from "react";
import { Transaction, BalanceForecastResult, User } from "../types";
import {
  getBalanceForecast,
  getFinancialAlerts,
  getTransactionInsights,
  TransactionAnalysisResult,
  FinancialAlertWithDisclaimer,
} from "../services/AIService";

interface AIInsightsState {
  forecast: BalanceForecastResult | null;
  alerts: FinancialAlertWithDisclaimer[];
  insights: TransactionAnalysisResult | null;
  loading: boolean;
  error: string | null;
}

export function useAIInsights(
  transactions: Transaction[],
  totalBalance: number,
  region: User["region"]
): AIInsightsState {
  const [forecast, setForecast] = useState<BalanceForecastResult | null>(null);
  const [alerts, setAlerts] = useState<FinancialAlertWithDisclaimer[]>([]);
  const [insights, setInsights] = useState<TransactionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    let cancelled = false;

    const fetchAIData = async () => {
      setLoading(true);
      setError(null);

      try {
        const potentialMonthlySavings = 0;

        const [forecastRes, alertsRes, insightsRes] = await Promise.all([
          getBalanceForecast(transactions, totalBalance, potentialMonthlySavings, region),
          getFinancialAlerts(transactions, region),
          getTransactionInsights(transactions, region),
        ]);

        if (cancelled) return;

        setForecast(forecastRes);
        setAlerts(alertsRes);
        setInsights(insightsRes);
      } catch (err: any) {
        if (cancelled) return;
        console.error("❌ AI parallel fetch error:", err);
        setError(err?.message || "Failed to load AI insights");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    fetchAIData();

    return () => {
      cancelled = true;
    };
  }, [transactions, totalBalance, region]);

  return { forecast, alerts, insights, loading, error };
}
