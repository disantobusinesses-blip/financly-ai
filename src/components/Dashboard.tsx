import { useState } from "react";
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
import ProFeatureBlocker from "./ProFeatureBlocker";

// Demo data imports
import {
  demoTransactions,
  demoBalance,
  demoOptimizationPlan,
  demoAccounts,
} from "../demo/demoData";

export default function Dashboard() {
  // ✅ User can toggle between Demo and Live
  const [isDemo, setIsDemo] = useState(true);

  // Live data hook
  const { accounts, transactions, loading, error } = useBasiqData("real-user-id");

  // Derived values
  const txns = isDemo ? demoTransactions : transactions;
  const totalBalance = isDemo
    ? demoBalance
    : accounts.reduce((s, a) => s + a.balance, 0);

  // --- DEMO MODE: no API calls ---
  if (isDemo) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setIsDemo(false)}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Switch to Live Mode
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <SpendingForecast
                transactions={demoTransactions}
                totalBalance={demoBalance}
                savingsPlan={demoOptimizationPlan}
              />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <BalanceSummary accounts={demoAccounts} />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <CashflowMini transactions={demoTransactions} />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <SpendingByCategory transactions={demoTransactions} />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <SpendingChart transactions={demoTransactions} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <UpcomingBills accounts={demoAccounts} />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <SubscriptionCard />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <FinancialAlerts transactions={demoTransactions} />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <TransactionsList transactions={demoTransactions} />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <TransactionAnalysis transactions={demoTransactions} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIVE MODE: uses API ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <button
          onClick={() => setIsDemo(true)}
          className="mb-4 px-4 py-2 bg-primary text-white rounded"
        >
          Back to Demo Mode
        </button>
        Loading your financial data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <button
          onClick={() => setIsDemo(true)}
          className="mb-4 px-4 py-2 bg-primary text-white rounded"
        >
          Back to Demo Mode
        </button>
        Failed to load data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsDemo(true)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Switch to Demo Mode
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SpendingForecast
              transactions={transactions}
              totalBalance={totalBalance}
              savingsPlan={null}
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
