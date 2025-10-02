import React from "react";
import BalanceSummary from "./BalanceSummary";
import CashflowMini from "./CashflowMini";
import SpendingByCategory from "./SpendingByCategory";
import SpendingChart from "./SpendingChart";
import UpcomingBills from "./UpcomingBills";
import SubscriptionCard from "./SubscriptionCard";
import SpendingForecast from "./SpendingForecast";
import FinancialAlerts from "./FinancialAlerts";
import TransactionsList from "./TransactionsList";
import TransactionAnalysis from "./TransactionAnalysis";
import { useBasiqData } from "../hooks/useBasiqData";

export default function Dashboard() {
  const { accounts, transactions, loading, error } = useBasiqData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        Loading your financial data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        Failed to load data: {error}
      </div>
    );
  }

  if (accounts.length === 0 && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>No data yet. Connect your bank to see your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SpendingForecast
              transactions={transactions}
              totalBalance={accounts.reduce((s, a) => s + a.balance, 0)}
              savingsPlan={null} // ✅ live-only, no demo optimization plan
            />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <BalanceSummary accounts={accounts} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <CashflowMini transactions={transactions} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SpendingByCategory transactions={transactions} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SpendingChart transactions={transactions} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <UpcomingBills accounts={accounts} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SubscriptionCard />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <FinancialAlerts transactions={transactions} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <TransactionsList transactions={transactions} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <TransactionAnalysis transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
