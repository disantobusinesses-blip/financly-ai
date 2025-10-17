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

  // ✅ Case 1: Cached data is showing while fresh data is loading
  if (loading && accounts.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>Refreshing your live financial data...</p>
        {lastUpdated && (
          <p className="text-xs mt-2 text-gray-400">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  // ✅ Case 2: First-time load, no cached data yet
  if (loading && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>Loading your financial data...</p>
      </div>
    );
  }

  // ✅ Case 3: Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <p>Failed to load data: {error}</p>
      </div>
    );
  }

  // ✅ Case 4: User hasn't connected a bank yet
  if (accounts.length === 0 && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>No data yet. Connect your bank to see your dashboard.</p>
      </div>
    );
  }

  // ✅ Case 5: Normal dashboard view
  return (
    <div className="space-y-6 p-4">
      <FinancialWellnessScore accounts={accounts} transactions={transactions} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <BalanceSummary accounts={accounts} />

          <SpendingForecast
            transactions={transactions}
            totalBalance={totalBalance}
            savingsPlan={null}
          />

          <CashflowMini transactions={transactions} />

          <SpendingByCategory transactions={transactions} />

          <SpendingChart transactions={transactions} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <SubscriptionHunter transactions={transactions} />

          <SavingsCoach transactions={transactions} />

          <UpcomingBills accounts={accounts} />

          <FinancialAlerts transactions={transactions} />

          <TransactionsList transactions={transactions} />

          <TransactionAnalysis transactions={transactions} />
        </div>
      </div>

      <div className="text-center text-xs text-gray-400">{aiStatusMessage}</div>

      {/* ✅ Optional footer info */}
      {lastUpdated && (
        <div className="text-center text-xs text-gray-400 mt-4">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
