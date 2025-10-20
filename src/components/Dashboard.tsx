// src/components/Dashboard.tsx
import { useMemo } from "react";

import BalanceSummary from "./BalanceSummary";
import CashflowMini from "./CashflowMini";
import SpendingByCategory from "./SpendingByCategory";
import SpendingChart from "./SpendingChart";
import UpcomingBills from "./UpcomingBills";
import SpendingForecast from "./SpendingForecast";
import FinancialAlerts from "./FinancialAlerts";
import TransactionsList from "./TransactionsList";
import TransactionAnalysis from "./TransactionAnalysis";
import FinancialWellnessScore from "./FinancialWellnessScore";
import SubscriptionHunter from "./SubscriptionHunter";
import SavingsCoach from "./SavingsCoach";
import GoalPlanner from "./GoalPlanner";
import DashboardTour from "./DashboardTour";
import { useBasiqData } from "../hooks/useBasiqData";
import { useAuth } from "../contexts/AuthContext";
import { useGeminiAI } from "../hooks/useGeminiAI";

export default function Dashboard() {
  const { accounts, transactions, loading, error, lastUpdated } = useBasiqData();
  const { user } = useAuth();
  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );
  const {
    alerts: aiAlerts,
    insights: aiInsights,
    loading: aiLoading,
    error: aiError,
  } = useGeminiAI(transactions, totalBalance, user?.region ?? "AU");
  const goalSuggestions = aiInsights?.insights ?? [];

  const aiStatusMessage = useMemo(() => {
    if (aiLoading) {
      return "Generating AI insights...";
    }

    if (aiError) {
      return `AI enhancements unavailable: ${aiError}`;
    }

    const suggestionCount = aiInsights?.insights?.length ?? 0;
    const alertCount = aiAlerts.length;

    if (suggestionCount > 0 || alertCount > 0) {
      const suggestionLabel = suggestionCount === 1 ? "suggestion" : "suggestions";
      const alertLabel = alertCount === 1 ? "alert" : "alerts";

      return `AI insights ready with ${suggestionCount} ${suggestionLabel} and ${alertCount} ${alertLabel}.`;
    }

    return "AI enhancements ready.";
  }, [aiAlerts, aiError, aiInsights, aiLoading]);

  if (loading && accounts.length > 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-gray-500">
        <p>Refreshing your live financial data...</p>
        {lastUpdated && (
          <p className="mt-2 text-xs text-gray-400">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  if (loading && accounts.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-gray-500">
        <p>Loading your financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-red-500">
        <p>Failed to load data: {error}</p>
      </div>
    );
  }

  if (accounts.length === 0 && transactions.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-gray-500">
        <p>No data yet. Connect your bank to see your dashboard.</p>
      </div>
    );
  }

  const mobilePanels = [
    {
      key: "balance",
      id: "balance-summary-card",
      node: <BalanceSummary accounts={accounts} />,
    },
    {
      key: "subscription",
      id: "subscription-hunter-card",
      node: <SubscriptionHunter transactions={transactions} />,
    },
    {
      key: "forecast",
      id: "spending-forecast-card",
      node: (
        <SpendingForecast
          transactions={transactions}
          totalBalance={totalBalance}
          savingsPlan={null}
        />
      ),
    },
    {
      key: "cashflow",
      id: "cashflow-mini-card",
      node: <CashflowMini transactions={transactions} />,
    },
    {
      key: "category",
      id: "spending-by-category-card",
      node: <SpendingByCategory transactions={transactions} />,
    },
    {
      key: "share",
      id: "spending-chart-card",
      node: <SpendingChart transactions={transactions} />,
    },
    {
      key: "savings",
      id: "savings-coach-card",
      node: <SavingsCoach transactions={transactions} />,
    },
    {
      key: "alerts",
      id: "financial-alerts-card",
      node: <FinancialAlerts transactions={transactions} />,
    },
    {
      key: "bills",
      id: "upcoming-bills-card",
      node: <UpcomingBills transactions={transactions} />,
    },
    {
      key: "transactions",
      id: "transactions-card",
      node: <TransactionsList transactions={transactions} />,
    },
    {
      key: "analysis",
      id: "transaction-analysis-card",
      node: <TransactionAnalysis transactions={transactions} />,
    },
  ];

  return (
    <div className="space-y-6 px-4 pb-10 pt-4 sm:px-6">
      <DashboardTour enabled={accounts.length > 0} />
      <div data-tour-id="financial-wellness-card" data-tour-variant="shared">
        <FinancialWellnessScore accounts={accounts} transactions={transactions} />
      </div>
      <div data-tour-id="goal-planner" data-tour-variant="shared">
        <GoalPlanner
          accounts={accounts}
          transactions={transactions}
          aiSuggestions={goalSuggestions}
        />
      </div>

      <div className="-mx-4 md:hidden">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
          {mobilePanels.map((panel) => (
            <div
              key={panel.key}
              className="min-w-[85vw] snap-center"
              data-tour-id={panel.id}
              data-tour-variant="mobile"
            >
              {panel.node}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:flex md:flex-col md:gap-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <div data-tour-id="balance-summary-card" data-tour-variant="desktop">
              <BalanceSummary accounts={accounts} />
            </div>
            <div data-tour-id="spending-forecast-card" data-tour-variant="desktop">
              <SpendingForecast
                transactions={transactions}
                totalBalance={totalBalance}
                savingsPlan={null}
              />
            </div>
          </div>
          <div className="space-y-6">
            <div data-tour-id="subscription-hunter-card" data-tour-variant="desktop">
              <SubscriptionHunter transactions={transactions} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div data-tour-id="cashflow-mini-card" data-tour-variant="desktop">
            <CashflowMini transactions={transactions} />
          </div>
          <div data-tour-id="savings-coach-card" data-tour-variant="desktop">
            <SavingsCoach transactions={transactions} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div data-tour-id="spending-by-category-card" data-tour-variant="desktop">
            <SpendingByCategory transactions={transactions} />
          </div>
          <div data-tour-id="spending-chart-card" data-tour-variant="desktop">
            <SpendingChart transactions={transactions} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div data-tour-id="upcoming-bills-card" data-tour-variant="desktop">
            <UpcomingBills transactions={transactions} />
          </div>
          <div data-tour-id="financial-alerts-card" data-tour-variant="desktop">
            <FinancialAlerts transactions={transactions} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div data-tour-id="transactions-card" data-tour-variant="desktop">
            <TransactionsList transactions={transactions} />
          </div>
          <div data-tour-id="transaction-analysis-card" data-tour-variant="desktop">
            <TransactionAnalysis transactions={transactions} />
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">{aiStatusMessage}</div>

      {lastUpdated && (
        <div className="text-center text-xs text-slate-400">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
