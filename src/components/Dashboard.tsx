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
import { useBasiqData } from "../hooks/useBasiqData";
import DashboardLayout from "./DashboardLayout";

import { demoTransactions, demoBalance, demoSavingsPlan } from "../demo/demoData";

export default function Dashboard() {
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
        {/* Forecast full width */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4">
          <SpendingForecast
            transactions={txns}
            totalBalance={totalBalance}
            savingsPlan={demoSavingsPlan}
          />
        </div>

        {/* Balance + Cashflow row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4 text-sm sm:text-base">
            <BalanceSummary accounts={accounts} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4 text-sm sm:text-base">
            <CashflowMini transactions={txns} />
          </div>
        </div>

        {/* Accordion for secondary widgets on mobile */}
        <details className="lg:hidden bg-white dark:bg-neutral-900 rounded-lg shadow">
          <summary className="cursor-pointer p-3 sm:p-4 text-sm font-semibold">
            Show More Insights
          </summary>
          <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 text-sm sm:text-base">
            <SpendingByCategory transactions={txns} />
            <SpendingChart transactions={txns} />
            <UpcomingBills accounts={accounts} />
            <FinancialAlerts transactions={txns} />
            <SubscriptionCard />
          </div>
        </details>

        {/* Desktop view for secondary widgets */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4">
            <SpendingByCategory transactions={txns} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4">
            <SpendingChart transactions={txns} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4">
            <UpcomingBills accounts={accounts} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4">
            <FinancialAlerts transactions={txns} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4">
            <SubscriptionCard />
          </div>
        </div>

        {/* Transactions full width bottom */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-3 sm:p-4 text-sm sm:text-base">
          <TransactionsList transactions={txns} />
        </div>
      </div>
    </DashboardLayout>
  );
}
