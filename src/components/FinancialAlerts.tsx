import React, { useState, useEffect, useRef } from "react";
import { Transaction, FinancialAlert, FinancialAlertType } from "../types";
import { getFinancialAlerts } from "../services/GeminiService";
import { WarningIcon, HandshakeIcon, TrophyIcon, SparklesIcon } from "./icon/Icon";
import { useAuth } from "../contexts/AuthContext";
import { useOnScreen } from "../hooks/useOnScreen";
import Card from "./Card";

interface FinancialAlertsProps {
  transactions: Transaction[];
}

const ALERT_DISCLAIMER = "This is not Financial advice.";

const alertConfig: Record<FinancialAlertType, { icon: React.ReactNode; accent: string; badge: string }> = {
  Anomaly: {
    icon: <WarningIcon className="h-6 w-6" />,
    accent: "bg-rose-100 text-rose-600",
    badge: "bg-rose-50 text-rose-500",
  },
  Opportunity: {
    icon: <HandshakeIcon className="h-6 w-6" />,
    accent: "bg-emerald-100 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-500",
  },
  Milestone: {
    icon: <TrophyIcon className="h-6 w-6" />,
    accent: "bg-amber-100 text-amber-600",
    badge: "bg-amber-50 text-amber-500",
  },
};

const AlertCard: React.FC<{ alert: FinancialAlert }> = ({ alert }) => {
  const config = alertConfig[alert.type] || alertConfig.Anomaly;
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${config.accent}`}>
          {config.icon}
        </span>
        <div className="space-y-1">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config.badge}`}>
            {alert.type}
          </span>
          <h4 className="text-base font-semibold text-slate-900">{alert.title}</h4>
          <p className="text-sm text-slate-600">{alert.description}</p>
          <p className="text-xs text-slate-400">{alert.disclaimer ?? ALERT_DISCLAIMER}</p>
        </div>
      </div>
    </li>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-16 w-full rounded-2xl bg-slate-100" />
    <div className="h-16 w-full rounded-2xl bg-slate-100" />
    <div className="h-16 w-full rounded-2xl bg-slate-100" />
  </div>
);

const FinancialAlerts: React.FC<FinancialAlertsProps> = ({ transactions }) => {
  const { user } = useAuth();
  const ref = useRef<HTMLElement>(null);
  const isVisible = useOnScreen(ref);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (isVisible && transactions.length > 0 && !hasFetched && user) {
        setIsLoading(true);
        setHasFetched(true);
        try {
          const result = await getFinancialAlerts(transactions, user.region);
          setAlerts(result);
          setError(null);
        } catch (err) {
          console.error(err);
          setError("Alerts unavailable");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAlerts();
  }, [isVisible, transactions, hasFetched, user]);

  return (
    <Card
      ref={ref}
      title="AI financial watchdog"
      icon={<SparklesIcon className="h-7 w-7" />}
      subtitle="We scan your transactions for risky trends, missed savings and major wins."
      insights={[
        { label: "Alerts", value: String(alerts.length) },
        error
          ? { label: "Status", value: "Issue", tone: "negative" }
          : { label: "Status", value: isLoading ? "Loading" : "Live" },
      ]}
    >
      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <p className="text-sm text-rose-500">{error}</p>
        ) : alerts.length > 0 ? (
          <ul className="space-y-3">
            {alerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            <p>No new alerts right now.</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
              We’ll notify you when we spot something important!
            </p>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-400">{ALERT_DISCLAIMER}</p>
    </Card>
  );
};

export default FinancialAlerts;
