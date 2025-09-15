import React, { useState, useEffect, useRef } from 'react';
import { Transaction, FinancialAlert, FinancialAlertType } from '../types';
// FIX: Corrected import casing to match file system.
import { getFinancialAlerts } from '../services/GeminiService';
import { WarningIcon, HandshakeIcon, TrophyIcon, SparklesIcon } from './icon/Icon';
// FIX: Corrected import casing to match file system.
import { useAuth } from '../contexts/authContext';
import ProFeatureBlocker from './ProFeatureBlocker';
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
          setAlerts(result);
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
    <div className="bg-content-bg p-6 rounded-xl border border-border-color h-full" ref={ref}>
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-7 w-7 text-primary" />
        <h2 className="text-2xl font-bold text-text-primary ml-3">AI Financial Watchdog</h2>
      </div>

      {user?.membershipType === 'Pro' ? (
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : alerts.length > 0 ? (
            alerts.map((alert, index) => <AlertCard key={index} alert={alert} />)
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary">No new alerts right now.</p>
              <p className="text-sm text-text-tertiary">We'll notify you when we spot something important!</p>
            </div>
          )}
        </div>
      ) : (
        <ProFeatureBlocker
          featureTitle="AI Financial Watchdog"
          teaserText={isLoading ? "Analyzing your finances for alerts..." : `AI found ${alerts.length} potential alert${alerts.length !== 1 ? 's' : ''} for you to review.`}
        >
           <LoadingSkeleton />
        </ProFeatureBlocker>
      )}
    </div>
  );
};

export default FinancialAlerts;