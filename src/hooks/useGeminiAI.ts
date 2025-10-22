// src/hooks/useGeminiAI.ts
import { useState, useEffect } from "react";
import { Transaction, BalanceForecastResult, User } from "../types";
import {
  getBalanceForecast,
  getFinancialAlerts,
  getTransactionInsights,
} from "../services/GeminiService";

/**
 * Combined AI data interface
 */
interface GeminiAIData {
  forecast: BalanceForecastResult | null;
  alerts: any[]; // FinancialAlert[]
  insights: {
    insights: { emoji: string; text: string }[];
    summary: string;
    stats: { label: string; value: string; tone?: "positive" | "negative" | "neutral" }[];
    disclaimer: string;
  } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch all Gemini AI data in parallel.
 * @param transactions User's transaction list.
 * @param totalBalance Current total balance across accounts
 * @param region 'AU' | 'US'
 */
export function useGeminiAI(
  transactions: Transaction[],
  totalBalance: number,
  region: User["region"]
): GeminiAIData {
  const [forecast, setForecast] = useState<BalanceForecastResult | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [insights, setInsights] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    const fetchAIData = async () => {
      setLoading(true);
      setError(null);

      try {
        const potentialMonthlySavings = 0; // Adjust later when savings plan is implemented

        // ⚡ Run all AI calls in parallel
        const [forecastRes, alertsRes, insightsRes] = await Promise.all([
          getBalanceForecast(transactions, totalBalance, potentialMonthlySavings, region),
          getFinancialAlerts(transactions, region),
          getTransactionInsights(transactions, region),
        ]);

        setForecast(forecastRes);
        setAlerts(alertsRes);
        setInsights(insightsRes);
      } catch (err: any) {
        console.error("❌ Gemini parallel fetch error:", err);
        setError(err.message || "Failed to load AI data");
      } finally {
        setLoading(false);
      }
    };

    fetchAIData();
  }, [transactions, totalBalance, region]);

  return { forecast, alerts, insights, loading, error };
}