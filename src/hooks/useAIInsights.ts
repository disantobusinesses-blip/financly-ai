import { useEffect, useMemo, useState } from "react";
import {
  Account,
  Transaction,
  BalanceForecastResult,
  User,
  FinancialAlert,
  FinancialAlertType,
} from "../types";
import {
  fetchFinancialAnalysis,
  FinancialAnalysisCleanData,
  TransactionAnalysisResult,
} from "../services/AIService";

interface AIInsightsState {
  forecast: BalanceForecastResult | null;
  alerts: FinancialAlert[];
  insights: TransactionAnalysisResult | null;
  loading: boolean;
  error: string | null;
  disclaimer: string;
  cleanData: FinancialAnalysisCleanData | null;
  cached: boolean;
  generatedAt: string | null;
}

export function useAIInsights(
  userId: string | undefined,
  region: User["region"],
  accounts: Account[],
  transactions: Transaction[],
  totalBalance: number
): AIInsightsState {
  const [forecast, setForecast] = useState<BalanceForecastResult | null>(null);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [insights, setInsights] = useState<TransactionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState("This is not financial advice.");
  const [cleanData, setCleanData] = useState<FinancialAnalysisCleanData | null>(
    null
  );
  const [cached, setCached] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const period = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      const now = new Date();
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    }
    let latest: Date | null = null;
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      if (Number.isNaN(date.getTime())) return;
      if (!latest || date > latest) {
        latest = date;
      }
    });
    const target = latest || new Date();
    return { month: target.getMonth() + 1, year: target.getFullYear() };
  }, [transactions]);

  useEffect(() => {
    if (!userId || !transactions || transactions.length === 0) {
      setForecast(null);
      setAlerts([]);
      setInsights(null);
      setCleanData(null);
      setCached(false);
      setGeneratedAt(null);
      return;
    }

    let cancelled = false;

    const fetchAIData = async () => {
      setLoading(true);
      setError(null);

      try {
        const sanitisedTransactions = transactions.map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount) || 0,
        }));

        const payload = await fetchFinancialAnalysis({
          userId,
          month: period.month,
          year: period.year,
          region,
          transactions: sanitisedTransactions,
          accounts,
          totalBalance,
        });

        if (cancelled) return;

        setForecast(payload.analysis?.forecast || null);
        const normalisedAlerts = (payload.analysis?.alerts || []).map((alert) => {
          const rawType = alert?.type;
          const validType: FinancialAlertType = [
            "Anomaly",
            "Opportunity",
            "Milestone",
          ].includes(rawType as FinancialAlertType)
            ? (rawType as FinancialAlertType)
            : "Anomaly";
          return {
            type: validType,
            title: alert.title || "Check your activity",
            description: alert.description || "We couldn't generate extra detail for this alert.",
            disclaimer: alert.disclaimer,
          };
        });
        setAlerts(normalisedAlerts);
        setInsights(
          payload.analysis
            ? {
                insights: payload.analysis.insights || [],
                subscriptions: payload.analysis.subscriptions || [],
                disclaimer: payload.analysis.disclaimer,
              }
            : null
        );
        setDisclaimer(
          payload.analysis?.disclaimer || "This is not financial advice."
        );
        setCleanData(payload.cleanData);
        setCached(Boolean(payload.cached));
        setGeneratedAt(payload.generatedAt || null);
      } catch (err: any) {
        if (cancelled) return;
        console.error("❌ AI parallel fetch error:", err);
        setError(err?.message || "Failed to load AI insights");
        setForecast(null);
        setAlerts([]);
        setInsights(null);
        setCleanData(null);
        setCached(false);
        setGeneratedAt(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    fetchAIData();

    return () => {
      cancelled = true;
    };
  }, [userId, region, accounts, transactions, totalBalance, period.month, period.year]);

  return {
    forecast,
    alerts,
    insights,
    loading,
    error,
    disclaimer,
    cleanData,
    cached,
    generatedAt,
  };
}
