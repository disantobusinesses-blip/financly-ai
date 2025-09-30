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
import {
  demoTransactions,
  demoBalance,
  demoOptimizationPlan,
  demoAccounts,
} from "../demo/demoData";

export default function Dashboard() {
  const [forceDemo, setForceDemo] = useState(false);

  // Hook now reads localStorage for basiqUserId
  const { accounts, transactions, loading, error, mode } = useBasiqData();

  // Final mode = forced demo OR hook’s detected mode
  const effectiveMode: "demo" | "live" = forceDemo ? "demo" : mode;

  const totalBalance =
    effectiveMode === "demo"
      ? demoBalance
      : accounts.reduce((s, a) => s + a.balance, 0);

  // --- DEMO MODE ---
  if (effectiveMode === "demo") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setForceDemo(false)}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Switch to Live Mode
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
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

  // --- LIVE MODE ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <button
          onClick={() => setForceDemo(true)}
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
          onClick={() => setForceDemo(true)}
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
        onClick={() => setForceDemo(true)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Switch to Demo Mode
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
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
