import { useEffect, useState } from "react";
import {
  fetchFinancialAnalysis,
  TransactionAnalysisResult,
  FinancialAnalysisRequest,
} from "../services/AIService";

export function useAIInsights(payload: FinancialAnalysisRequest | null) {
  const [data, setData] = useState<TransactionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!payload) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    fetchFinancialAnalysis(payload)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) setError(err.message || "AI analysis failed");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [payload]);

  return { data, loading, error };
}
