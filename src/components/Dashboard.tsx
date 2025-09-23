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
import ProFeatureBlocker from "./ProFeatureBlocker";
import { demoTransactions, demoBalance, demoOptimizationPlan } from "../demo/demoData";

export default function Dashboard() {
  const isDemo = false; // toggle for demo
  const userId = isDemo ? "" : "real-user-id";

  const { accounts, transactions, loading, error } = useBasiqData(userId);

  const txns = isDemo ? demoTransactions : transactions;
  const totalBalance = isDemo ? demoBalance : accounts.reduce((s, a) => s + a.balance, 0);

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading your financial data...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">Failed to load data: {error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow hover:shadow-lg transition p-4 overflow-hidden">
          {isDemo ? (
            <ProFeatureBlocker featureTitle="AI Balance Forecast" teaserText="Unlock your 6-month forecast and see how much you could save.">
              <SpendingForecast transactions={txns} totalBalance={totalBalance} savingsPlan={demoOptimizationPlan} />
            </ProFeatureBlocker>
          ) : (
            <SpendingForecast transactions={txns} totalBalance={totalBalance} savingsPlan={null} />
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <BalanceSummary accounts={accounts} />
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <CashflowMini transactions={txns} />
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <SpendingByCategory transactions={txns} />
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <SpendingChart transactions={txns} />
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <UpcomingBills accounts={accounts} /> {/* pass required prop */}
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <SubscriptionCard />
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <FinancialAlerts transactions={txns} /> {/* pass required prop */}
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <TransactionsList transactions={txns} />
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <TransactionAnalysis transactions={txns} />
        </div>
      </div>
    </div>
  );
}
