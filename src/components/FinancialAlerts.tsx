
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, FinancialAlert, FinancialAlertType } from '../types';
import { getFinancialAlerts } from '../services/AIService';
import { WarningIcon, HandshakeIcon, TrophyIcon, SparklesIcon } from './icon/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useOnScreen } from '../hooks/useOnScreen';

interface FinancialAlertsProps {
  transactions: Transaction[];
}

const alertConfig: Record<FinancialAlertType, { icon: React.ReactNode; color: string }> = {
  Anomaly: {
    icon: <WarningIcon className="h-6 w-6" />,
    color: 'border-l-warning',
  },
  Opportunity: {
    icon: <HandshakeIcon className="h-6 w-6" />,
    color: 'border-l-blue-500',
  },
  Milestone: {
    icon: <TrophyIcon className="h-6 w-6" />,
    color: 'border-l-secondary',
  },
};

const AlertCard: React.FC<{ alert: FinancialAlert }> = ({ alert }) => {
  const config = alertConfig[alert.type] || alertConfig.Anomaly;
  return (
    <div className={`flex items-start p-4 bg-background rounded-lg border border-l-4 ${config.color} border-border-color`}>
      <div className={`mr-4 flex-shrink-0 ${config.color.replace('border-l-', 'text-')}`}>
        {config.icon}
      </div>
      <div>
        <h4 className="font-bold text-text-primary">{alert.title}</h4>
        <p className="text-sm text-text-secondary">{alert.description}</p>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
    <div className="space-y-3 animate-pulse">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
    </div>
);

const FinancialAlerts: React.FC<FinancialAlertsProps> = ({ transactions }) => {
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (isVisible && transactions.length > 0 && !hasFetched && user) {
        setIsLoading(true);
        setHasFetched(true);
        try {
          const result = await getFinancialAlerts(transactions, user.region);
          const sanitised = result.map((alert) => {
            const rawType = typeof alert.type === "string" ? alert.type : "Anomaly";
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
              description:
                alert.description ||
                "We couldn't generate extra detail for this alert.",
              disclaimer: alert.disclaimer,
            };
          });
          setAlerts(sanitised);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAlerts();
  }, [isVisible, transactions, hasFetched, user]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10" ref={ref}>
      <div className="mb-6 flex items-center">
        <SparklesIcon className="h-7 w-7 text-primary" />
        <h2 className="ml-3 text-2xl font-bold text-slate-900 dark:text-white">AI Financial Watchdog</h2>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : alerts.length > 0 ? (
          alerts.map((alert, index) => <AlertCard key={index} alert={alert} />)
        ) : (
          <div className="py-8 text-center">
            <p className="text-slate-600 dark:text-slate-300">No new alerts right now.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">We'll notify you when we spot something important!</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Insights are informational only and not financial advice.</p>
    </div>
  );
};

export default FinancialAlerts;
