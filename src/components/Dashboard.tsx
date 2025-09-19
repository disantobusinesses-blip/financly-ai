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
import DashboardLayout from "./DashboardLayout";

import {
  demoTransactions,
  demoBalance,
  demoSavingsPlan,
} from "../demo/demoData";

export default function Dashboard() {
  const isDemo = true;
  const userId = isDemo ? null : "real-user-id";

  const { accounts, transactions } = useBasiqData(userId || "");

  const txns = isDemo ? demoTransactions : transactions;
  const totalBalance = isDemo
    ? demoBalance
    : accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const savingsPlan = isDemo ? demoSavingsPlan : null;

  return (
    <DashboardLayout>
      {/* Adaptive grid: 2/3 left, 1/3 right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <SpendingForecast
            transactions={txns}
            totalBalance={totalBalance}
            savingsPlan={savingsPlan}
          />
          <BalanceSummary accounts={accounts} />
          <CashflowMini transactions={txns} />
          <SpendingByCategory transactions={txns} />
          <SpendingChart transactions={txns} />
          <UpcomingBills accounts={accounts} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <TransactionsList transactions={txns} />
          <FinancialAlerts transactions={txns} />
          <TransactionAnalysis transactions={txns} />
          <SubscriptionCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
