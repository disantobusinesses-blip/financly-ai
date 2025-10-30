// src/components/SpendingForecast.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, LineChart } from "recharts";
import { Transaction, BalanceForecastResult, SavingsOptimizationPlan } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getBalanceForecast } from "../services/AIService";
import { useOnScreen } from "../hooks/useOnScreen";
import { formatCurrency } from "../utils/currency";
import { SparklesIcon, TrendingUpIcon } from "./icon/Icon";

interface SpendingForecastProps {
  transactions: Transaction[];
  totalBalance: number;
  savingsPlan: SavingsOptimizationPlan | null;
}

const CustomTooltip = ({ active, payload, label, region }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-content-bg p-2 border border-border-color rounded-md shadow-lg">
        <p className="label font-bold text-text-primary">{`${label}`}</p>
        {payload.map((pld: any, index: number) =>
          pld.value ? <p key={index} style={{ color: pld.color }}>{`${pld.name}: ${formatCurrency(pld.value, region)}`}</p> : null
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

  const containerRef = useRef<HTMLDivElement | null>(null);
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

  return (
    <div className="bg-content-bg p-6 rounded-xl border border-border-color" ref={containerRef}>
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-7 w-7 text-primary" />
        <h2 className="text-2xl font-bold text-text-primary ml-3">Spending Forecast</h2>
      </div>

      {loading ? (
        <p className="text-text-secondary">Generating forecast...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : forecast ? (
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={theme === "dark" ? "#fff" : "#000"} />
                <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
                <Tooltip content={<CustomTooltip region={user?.region || "AU"} />} />
                <Legend />
                <Line type="monotone" dataKey="defaultForecast" stroke="#8884d8" strokeWidth={2} dot={false} name="Default Forecast" />
                <Line type="monotone" dataKey="optimizedForecast" stroke="#82ca9d" strokeWidth={2} dot={false} name="Optimized Forecast" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-primary-light p-4 rounded-lg text-center">
            <p className="text-sm text-primary font-medium">{forecast.insight}</p>
            <div className="flex items-center justify-center gap-2 text-primary font-bold mt-2">
              <TrendingUpIcon className="h-5 w-5" />
              <span>
                Key changes:{" "}
                {forecast.keyChanges.map((kc, i) => (
                  <span key={i} className="ml-1">
                    {kc.description}
                    {i < forecast.keyChanges.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-text-secondary">Not enough data yet to generate a forecast.</p>
      )}
    </div>
  );
};

export default SpendingForecast;
