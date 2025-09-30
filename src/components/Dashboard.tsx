import { useEffect, useState } from "react";
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
import { initiateBankConnection } from "../services/BankingService";

// Demo data
import {
  demoTransactions,
  demoBalance,
  demoOptimizationPlan,
  demoAccounts,
} from "../demo/demoData";

export default function Dashboard() {
  const [mode, setMode] = useState<"none" | "demo" | "live">("none");

  // Grab Basiq userId from localStorage if it exists
  const basiqUserId = localStorage.getItem("basiqUserId") || undefined;

  // Hook only used when live
  const { accounts, transactions, loading, error } = useBasiqData(
    mode === "live" ? basiqUserId : undefined
  );

  // Auto-load live mode if a userId is already stored
  useEffect(() => {
    if (basiqUserId) {
      setMode("live");
    }
  }, [basiqUserId]);

  const handleDemoClick = () => {
    setMode("demo");
  };

  const handleConnectBank = async () => {
    try {
      // For sandbox you can default to demo@financly.com
      const { consentUrl, userId } = await initiateBankConnection("demo@financly.com");
      localStorage.setItem("basiqUserId", userId);
      window.location.href = consentUrl; // Redirect to consent flow
    } catch (err) {
      console.error("❌ Failed to start bank connection:", err);
      alert("Unable to connect to bank right now.");
    }
  };

  // Initial screen: no mode chosen yet
  if (mode === "none") {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <button
          onClick={handleDemoClick}
          className="px-6 py-3 bg-primary text-white rounded-lg"
        >
          Show Demo Account
        </button>
        <button
          onClick={handleConnectBank}
          className="px-6 py-3 bg-green-600 text-white rounded-lg"
        >
          Connect Bank (Sandbox)
        </button>
      </div>
    );
  }

  // DEMO MODE
  if (mode === "demo") {
    return (
      <div className="space-y-4">
        <button
          onClick={handleConnectBank}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Switch to Real Connection
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

  // LIVE MODE
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading your data...</div>;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 text-red-600">
        <button
          onClick={handleDemoClick}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Back to Demo Account
        </button>
        Failed to load data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleDemoClick}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Switch to Demo Account
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SpendingForecast
              transactions={transactions}
              totalBalance={accounts.reduce((s, a) => s + a.balance, 0)}
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
