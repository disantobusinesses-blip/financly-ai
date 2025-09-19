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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <SpendingForecast
              transactions={txns}
              totalBalance={totalBalance}
              savingsPlan={savingsPlan}
            />
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <BalanceSummary accounts={accounts} />
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <CashflowMini transactions={txns} />
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <SpendingByCategory transactions={txns} />
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <SpendingChart transactions={txns} />
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <UpcomingBills accounts={accounts} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <TransactionsList transactions={txns} />
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <FinancialAlerts transactions={txns} />
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <TransactionAnalysis transactions={txns} />
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
            <SubscriptionCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
