// src/components/Dashboard.tsx
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
  const { accounts, transactions, loading, error, lastUpdated } = useBasiqData();

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

  // ✅ Case 4: User hasn’t connected a bank yet
  if (accounts.length === 0 && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>No data yet. Connect your bank to see your dashboard.</p>
      </div>
    );
  }

  // ✅ Case 5: Normal dashboard view
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SpendingForecast
              transactions={transactions}
              totalBalance={accounts.reduce((sum, a) => sum + a.balance, 0)}
              savingsPlan={null} // Live-only
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

        {/* RIGHT COLUMN */}
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

      {/* ✅ Optional footer info */}
      {lastUpdated && (
        <div className="text-center text-xs text-gray-400 mt-4">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}