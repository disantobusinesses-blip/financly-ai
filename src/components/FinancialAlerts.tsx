
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
    color: 'border-l-amber-400',
  },
  Opportunity: {
    icon: <HandshakeIcon className="h-6 w-6" />,
    color: 'border-l-sky-400',
  },
  Milestone: {
    icon: <TrophyIcon className="h-6 w-6" />,
    color: 'border-l-emerald-400',
  },
};

const AlertCard: React.FC<{ alert: FinancialAlert }> = ({ alert }) => {
  const config = alertConfig[alert.type] || alertConfig.Anomaly;
  return (
    <div className={`flex items-start gap-4 rounded-2xl border border-white/10 border-l-4 bg-white/5 p-4 ${config.color}`}>
      <div className="flex-shrink-0 text-white">
        {config.icon}
      </div>
      <div>
        <h4 className="text-base font-semibold text-white">{alert.title}</h4>
        <p className="text-sm text-white/70">{alert.description}</p>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-16 rounded-2xl bg-white/10" />
    <div className="h-16 rounded-2xl bg-white/10" />
    <div className="h-16 rounded-2xl bg-white/10" />
  </div>
);

const FinancialAlerts: React.FC<FinancialAlertsProps> = ({ alerts, loading, error, disclaimer }) => {
  return (
    <div className="futuristic-card hover-zoom rounded-3xl p-6 text-white">
      <div className="mb-6 flex items-center">
        <SparklesIcon className="h-7 w-7 text-primary-light" />
        <h2 className="ml-3 text-2xl font-bold">AI alerts</h2>
      </div>

      <div className="space-y-4">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert, index) => <AlertCard key={index} alert={alert} />)
        ) : (
          <div className="py-8 text-center">
            <p className="text-white/70">No new alerts right now.</p>
            <p className="text-sm text-white/50">We'll notify you when we spot something important!</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-white/50">{disclaimer || 'Insights are informational only and not financial advice.'}</p>
    </div>
  );
};

export default FinancialAlerts;
