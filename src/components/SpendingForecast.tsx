// src/components/SpendingForecast.tsx
import React, { useMemo } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, LineChart } from "recharts";
import { BalanceForecastResult, User } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { formatCurrency } from "../utils/currency";
import { SparklesIcon, TrendingUpIcon } from "./icon/Icon";

interface SpendingForecastProps {
  forecast: BalanceForecastResult | null;
  loading: boolean;
  error?: string | null;
  region: User["region"];
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

const SpendingForecast: React.FC<SpendingForecastProps> = ({ forecast, loading, error, region }) => {
  const { theme } = useTheme();
  const activeRegion = region || "AU";

  const chartData = useMemo(() => {
    if (!forecast) return [];
    return forecast.forecastData.map((d) => ({
      ...d,
      defaultForecast: d.defaultForecast,
      optimizedForecast: d.optimizedForecast,
    }));
  }, [forecast]);

  return (
    <div className="bg-content-bg p-6 rounded-xl border border-border-color">
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
                <Tooltip content={<CustomTooltip region={activeRegion} />} />
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
