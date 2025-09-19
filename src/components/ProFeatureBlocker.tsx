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

import { demoTransactions, demoBalance, demoSavingsPlan } from "../demo/demoData";

export default function Dashboard() {
  const isDemo = true; // toggle this later if needed
  const userId = isDemo ? null : "real-user-id";
  const { accounts, transactions } = useBasiqData(userId || "");

  const txns = isDemo ? demoTransactions : transactions;
  const totalBalance = isDemo
    ? demoBalance
    : accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Forecast always visible */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow hover:shadow-lg transition p-4">
            <SpendingForecast
              transactions={txns}
              totalBalance={totalBalance}
              savingsPlan={demoSavingsPlan}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <BalanceSummary accounts={accounts} />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
              <CashflowMini transactions={txns} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SpendingByCategory transactions={txns} />
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SpendingChart transactions={txns} />
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <UpcomingBills accounts={accounts} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <TransactionsList transactions={txns} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <FinancialAlerts transactions={txns} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <TransactionAnalysis transactions={txns} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
            <SubscriptionCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
