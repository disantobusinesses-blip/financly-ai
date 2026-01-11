import React from "react";
import { BalanceForecastResult, FinancialAlert, User } from "../types";
import { TransactionAnalysisResult } from "../services/AIService";
import { formatCurrency } from "../utils/currency";
import { SparklesIcon, WarningIcon, ArrowRightIcon } from "./icon/Icon";

interface AIInsightsPanelProps {
  loading: boolean;
  error: string | null;
  insights: TransactionAnalysisResult | null;
  alerts: FinancialAlert[];
  forecast: BalanceForecastResult | null;
  disclaimer: string;
  generatedAt: string | null;
  region: User["region"];
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  loading,
  error,
  insights,
  alerts,
  forecast,
  disclaimer,
  generatedAt,
  region,
}) => {
  const hasInsights = Boolean(insights?.insights?.length);
  const hasAlerts = alerts.length > 0;
  const hasForecast = Boolean(forecast?.insight || forecast?.forecastData?.length);

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-white/5 to-transparent p-6 text-white shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <SparklesIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">AI overview</p>
            <h2 className="text-xl font-bold leading-tight">Personalised dashboard highlights</h2>
          </div>
        </div>
        {generatedAt && (
          <p className="text-xs text-white/60">Updated {new Date(generatedAt).toLocaleString()}</p>
        )}
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <WarningIcon className="h-5 w-5" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2 rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Top alerts</p>
            {hasAlerts ? (
              <ul className="space-y-2 text-sm text-white/80">
                {alerts.slice(0, 3).map((alert, idx) => (
                  <li key={`${alert.title}-${idx}`} className="flex items-start gap-2 rounded-xl bg-white/5 p-3">
                    <WarningIcon className="mt-0.5 h-4 w-4 text-amber-300" />
                    <div>
                      <p className="font-semibold text-white">{alert.title}</p>
                      <p className="text-xs text-white/70">{alert.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/70">No alerts detected in your latest activity.</p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">AI insights</p>
            {hasInsights ? (
              <ul className="space-y-2 text-sm text-white/80">
                {insights?.insights?.slice(0, 3).map((item, idx) => (
                  <li
                    key={`${item.text}-${idx}`}
                    className="flex items-start gap-2 rounded-xl bg-white/5 p-3"
                  >
                    <span className="text-lg">{item.emoji || "💡"}</span>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/70">Your AI notes will appear once transactions finish syncing.</p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">6-month outlook</p>
            {hasForecast && forecast?.forecastData?.length ? (
              <>
                <p className="text-sm text-white/80">{forecast?.insight}</p>
                <div className="space-y-2">
                  {forecast.forecastData.slice(0, 2).map((entry) => (
                    <div
                      key={entry.month}
                      className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-white/70">
                        <ArrowRightIcon className="h-4 w-4 text-primary" />
                        {entry.month}
                      </span>
                      <div className="text-right">
                        <p className="text-xs text-white/60">Default</p>
                        <p className="text-white">
                          {formatCurrency(entry.defaultForecast, region, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                        <p className="text-xs text-primary/80">Optimised {formatCurrency(entry.optimizedForecast, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-white/70">We will plot your forecast after a few transactions land.</p>
            )}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-white/60">{disclaimer}</p>
    </section>
  );
};

export default AIInsightsPanel;
