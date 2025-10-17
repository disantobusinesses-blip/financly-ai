// src/components/SpendingForecast.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, LineChart } from "recharts";
import { Transaction, BalanceForecastResult, SavingsOptimizationPlan } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getBalanceForecast } from "../services/GeminiService";
import { useOnScreen } from "../hooks/useOnScreen";
import { formatCurrency } from "../utils/currency";
import { SparklesIcon, TrendingUpIcon } from "./icon/Icon";
import Card from "./Card";

interface SpendingForecastProps {
  transactions: Transaction[];
  totalBalance: number;
  savingsPlan: SavingsOptimizationPlan | null;
}

const CustomTooltip = ({ active, payload, label, region }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-slate-900/90 p-3 text-white shadow-xl">
        <p className="text-sm font-semibold">{label}</p>
        {payload.map((pld: any, index: number) =>
          pld.value ? (
            <p key={index} className="text-xs" style={{ color: pld.color }}>
              {pld.name}: {formatCurrency(pld.value, region)}
            </p>
          ) : null
        )}
      </div>
    );
  }
  return null;
};

const SpendingForecast: React.FC<SpendingForecastProps> = ({ transactions, totalBalance, savingsPlan }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [forecast, setForecast] = useState<BalanceForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);
  const isOnScreen = useOnScreen(containerRef);

  useEffect(() => {
  if (isOnScreen && !forecast && !loading) {
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const potentialSavings = Number(savingsPlan?.totalMonthlySavings) || 0;

        // ✅ Ensure transactions amounts are numbers
        const cleanedTransactions = transactions.map((t) => ({
          ...t,
          amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
        }));

        const numericBalance =
          typeof totalBalance === "string"
            ? parseFloat(totalBalance)
            : totalBalance;

        const result = await getBalanceForecast(
          cleanedTransactions,
          numericBalance,
          potentialSavings,
          user?.region || "AU"
        );

        // ✅ Ensure forecastData values are numbers
        result.forecastData = result.forecastData.map((d: any) => ({
          ...d,
          defaultForecast: Number(d.defaultForecast) || 0,
          optimizedForecast: Number(d.optimizedForecast) || 0,
        }));

        setForecast(result);
      } catch (err: any) {
        console.error("❌ Failed to generate forecast:", err);
        setError(err.message || "Failed to generate forecast");
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }
}, [isOnScreen, forecast, loading, transactions, totalBalance, savingsPlan, user?.region]);


  const chartData = useMemo(() => {
    if (!forecast) return [];
    return forecast.forecastData.map((d) => ({
      ...d,
      defaultForecast: d.defaultForecast,
      optimizedForecast: d.optimizedForecast,
    }));
  }, [forecast]);

  const optimisedLift = forecast
    ? (() => {
        const lastPoint = forecast.forecastData[forecast.forecastData.length - 1];
        if (!lastPoint) return 0;
        return lastPoint.optimizedForecast - lastPoint.defaultForecast;
      })()
    : 0;

  return (
    <Card
      ref={containerRef}
      title="Spending forecast"
      subtitle="Compare your current trajectory with the optimised plan our AI recommends."
      icon={<SparklesIcon className="h-7 w-7" />}
      insights={[
        {
          label: "Months modelled",
          value: String(forecast?.forecastData.length ?? 0),
        },
        {
          label: "Optimised lift",
          value: formatCurrency(optimisedLift || 0, user?.region || "AU"),
          tone: optimisedLift >= 0 ? "positive" : "negative",
        },
        {
          label: "Status",
          value: loading ? "Running" : error ? "Error" : "Ready",
          tone: error ? "negative" : loading ? "neutral" : "positive",
        },
      ]}
    >
      {loading ? (
        <p className="text-sm text-white/80">Generating forecast...</p>
      ) : error ? (
        <p className="text-sm text-rose-200">{error}</p>
      ) : forecast ? (
        <div className="space-y-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.4} />
                <XAxis dataKey="month" stroke={theme === "dark" ? "#e2e8f0" : "#0f172a"} />
                <YAxis stroke={theme === "dark" ? "#e2e8f0" : "#0f172a"} />
                <Tooltip content={<CustomTooltip region={user?.region || "AU"} />} />
                <Legend wrapperStyle={{ color: "#e2e8f0" }} />
                <Line
                  type="monotone"
                  dataKey="defaultForecast"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={false}
                  name="Current path"
                />
                <Line
                  type="monotone"
                  dataKey="optimizedForecast"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={false}
                  name="Optimised"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 text-center text-sm text-white/80">
            <p>{forecast.insight}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs uppercase tracking-wide text-white">
              <TrendingUpIcon className="h-4 w-4" />
              <span>Key changes</span>
              {forecast.keyChanges.map((kc, i) => (
                <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-white/80">
                  {kc.description}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/70">Not enough data yet to generate a forecast.</p>
      )}
    </Card>
  );
};

export default SpendingForecast;
