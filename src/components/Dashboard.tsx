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
import DashboardLayout from "./DashboardLayout";
import ProFeatureBlocker from "./ProFeatureBlocker";
import { demoTransactions, demoBalance, demoSavingsPlan } from "../demo/demoData";

export default function Dashboard() {
  const [showMore, setShowMore] = useState(false);

  const isDemo = true;
  const userId = isDemo ? null : "real-user-id";
  const { accounts, transactions } = useBasiqData(userId || "");

  const txns = isDemo ? demoTransactions : transactions;
  const totalBalance = isDemo
    ? demoBalance
    : accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Forecast always visible */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
          <SpendingForecast
            transactions={txns}
            totalBalance={totalBalance}
            savingsPlan={demoSavingsPlan}
          />
        </div>

        {/* Quick KPIs row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3">
            <BalanceSummary accounts={accounts} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3">
            <CashflowMini transactions={txns} />
          </div>
        </div>

        {/* Accordion for secondary insights */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full flex justify-between items-center p-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            <span>{showMore ? "Hide insights" : "More insights"}</span>
            <span>{showMore ? "−" : "+"}</span>
          </button>
          {showMore && (
            <div className="p-4 space-y-4">
              <SpendingByCategory transactions={txns} />
              <SpendingChart transactions={txns} />
              <FinancialAlerts transactions={txns} />
              <UpcomingBills accounts={accounts} />
              <SubscriptionCard />
              <TransactionAnalysis transactions={txns} />
            </div>
          )}
        </div>

        {/* Transactions always visible at bottom */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
          <TransactionsList transactions={txns} />
        </div>
      </div>
    </DashboardLayout>
  );
}
