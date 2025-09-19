import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Transaction,
  BalanceForecastResult,
  SavingsPlan,
} from "../types";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  LineChart,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getBalanceForecast } from "../services/GeminiService";
import { useOnScreen } from "../hooks/useOnScreen";
import { formatCurrency, getCurrencyInfo } from "../utils/currency";
import {
  SparklesIcon,
  TrendingUpIcon,
  ArrowRightIcon,
} from "./icon/Icon";
import ProFeatureBlocker from "./ProFeatureBlocker";

interface SpendingForecastProps {
  transactions: Transaction[];
  totalBalance: number;
  savingsPlan: SavingsPlan | null;
  isDemo?: boolean;
}

const CustomTooltip = ({ active, payload, label, region }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-content-bg p-2 border border-border-color rounded-md shadow-lg">
        <p className="label font-bold text-text-primary">{`${label}`}</p>
        {payload.map(
          (pld: any, index: number) =>
            pld.value && (
              <p key={index} style={{ color: pld.color }}>
                {`${pld.name.replace("Forecast", " Forecast")}: ${formatCurrency(
                  pld.value,
                  region
                )}`}
              </p>
            )
        )}
      </div>
    );
  }
  return null;
};

const LoadingSkeleton = () => (
  <div className="h-80 w-full bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
);

const SpendingForecast: React.FC<SpendingForecastProps> = ({
  transactions,
  totalBalance,
  savingsPlan,
  isDemo,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);

  const [forecastResult, setForecastResult] =
    useState<BalanceForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      if (
        isVisible &&
        !hasFetched &&
        transactions.length > 0 &&
        savingsPlan !== undefined &&
        user
      ) {
        setIsLoading(true);
        setHasFetched(true);
        try {
          const potentialSavings = savingsPlan?.totalMonthlySavings || 0;
          const result = await getBalanceForecast(
            transactions,
            totalBalance,
            potentialSavings,
            user.region
          );
          setForecastResult(result);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchForecast();
  }, [isVisible, hasFetched, transactions, totalBalance, savingsPlan, user]);

  const chartData = useMemo(() => {
    if (!forecastResult) return [];
    const startingPoint = {
      month: "Now",
      defaultForecast: totalBalance,
      optimizedForecast: totalBalance,
    };
    return [startingPoint, ...forecastResult.forecastData];
  }, [forecastResult, totalBalance]);

  const renderChart = () => {
    const { symbol } = getCurrencyInfo(user?.region);
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === "dark" ? "#374151" : "#E2E8F0"}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
              tickFormatter={(value) =>
                `${symbol}${(value / 1000).toFixed(0)}k`
              }
            />
            <Tooltip content={<CustomTooltip region={user?.region} />} />
            <Legend wrapperStyle={{ fontSize: "14px" }} />
            <Line
              type="monotone"
              dataKey="defaultForecast"
              name="Default Forecast"
              stroke="#A0AEC0"
              strokeWidth={2}
              dot={true}
            />
            <Line
              type="monotone"
              dataKey="optimizedForecast"
              name="Optimized Forecast (with AI Plan)"
              stroke="#4F46E5"
              strokeWidth={3}
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div ref={ref}>
      <div className="flex items-center mb-2">
        <TrendingUpIcon className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-text-primary ml-2">
          AI Balance Forecast
        </h2>
      </div>
      <p className="text-text-secondary mb-4">
        Your projected account balance over the next 6 months.
      </p>

      {isLoading ? (
        <LoadingSkeleton />
      ) : chartData.length > 1 ? (
        renderChart()
      ) : (
        <div className="h-80 flex items-center justify-center">
          <p className="text-text-secondary">
            Not enough data to generate a forecast.
          </p>
        </div>
      )}

      {/* Insights & suggestions - gated by Pro */}
      {!isDemo && user?.membershipType !== "Pro" ? (
        <ProFeatureBlocker
          featureTitle="AI Insights"
          teaserText="Upgrade to Pro to unlock personalized insights and savings suggestions."
        >
          <div className="h-40" />
        </ProFeatureBlocker>
      ) : (
        forecastResult && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-bold text-sm mb-2 flex items-center">
                <SparklesIcon className="h-5 w-5 text-primary mr-2" />
                AI Insight
              </h4>
              <p className="text-sm text-text-secondary italic">
                {forecastResult.insight}
              </p>
            </div>
            {forecastResult.keyChanges?.length > 0 && (
              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-bold text-sm mb-3">
                  Your path to the Optimized Forecast:
                </h4>
                <ul className="space-y-2">
                  {forecastResult.keyChanges.map((change, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-text-secondary"
                    >
                      <ArrowRightIcon className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5 mr-2" />
                      {change.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default SpendingForecast;
