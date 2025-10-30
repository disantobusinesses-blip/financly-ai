
import React from 'react';
import { FinancialAlert, FinancialAlertType } from '../types';
import { WarningIcon, HandshakeIcon, TrophyIcon, SparklesIcon } from './icon/Icon';

interface FinancialAlertsProps {
  alerts: FinancialAlert[];
  loading: boolean;
  error?: string | null;
  disclaimer?: string;
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

const FinancialAlerts: React.FC<FinancialAlertsProps> = ({ alerts, loading, error, disclaimer }) => {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
      <div className="mb-6 flex items-center">
        <SparklesIcon className="h-7 w-7 text-primary" />
        <h2 className="ml-3 text-2xl font-bold text-slate-900 dark:text-white">AI Financial Watchdog</h2>
      </div>

      <div className="space-y-4">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert, index) => <AlertCard key={index} alert={alert} />)
        ) : (
          <div className="py-8 text-center">
            <p className="text-slate-600 dark:text-slate-300">No new alerts right now.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">We'll notify you when we spot something important!</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">{disclaimer || 'Insights are informational only and not financial advice.'}</p>
    </div>
  );
};

export default FinancialAlerts;
