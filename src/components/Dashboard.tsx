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
  demoSavingsPlan,
} from "../demo/demoData";

function BottomBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur border-t"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
    >
      <div className="mx-auto max-w-screen-xl px-3 py-2 grid grid-cols-3 gap-2 text-xs">
        <a href="/" className="text-center rounded-md border py-2">
          Home
        </a>
        <a href="/connect" className="text-center rounded-md border py-2">
          Connect
        </a>
        <a href="/upgrade" className="text-center rounded-md border py-2">
          Upgrade
        </a>
      </div>
    </nav>
  );
}

export default function Dashboard() {
  // Demo mode always ON for now
  const isDemo = true;
  const userId = isDemo ? null : "real-user-id";

  const { accounts, transactions, loading } = useBasiqData(userId || "");

  const txns = isDemo ? demoTransactions : transactions;
  const totalBalance = isDemo
    ? demoBalance
    : accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const savingsPlan = isDemo ? demoSavingsPlan : null;

  if (!isDemo && loading) {
    return <p className="p-6 text-center">Loading your financial data…</p>;
  }

  return (
    <main>
      <section
        className="mx-auto max-w-screen-xl px-3 py-3"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 grid-flow-row-dense">
          {/* AI Balance Forecast */}
          <div className="col-span-2 lg:col-span-3">
            <SpendingForecast
              transactions={txns}
              totalBalance={totalBalance}
              savingsPlan={savingsPlan}
            />
          </div>

          {/* Transaction Analysis */}
          <div id="subscriptions-section" className="col-span-2 lg:col-span-3">
            <TransactionAnalysis transactions={txns} />
          </div>

          {/* Balance Summary */}
          <div className="col-span-2 lg:col-span-2">
            <BalanceSummary accounts={accounts} />
          </div>

          {/* Cashflow Mini */}
          <div className="col-span-1 lg:col-span-2">
            <CashflowMini transactions={txns} />
          </div>

          {/* Spending Breakdown */}
          <div className="col-span-1 lg:col-span-2">
            <SpendingByCategory transactions={txns} />
          </div>

          {/* Spending Chart */}
          <div className="col-span-1 lg:col-span-2">
            <SpendingChart transactions={txns} />
          </div>

          {/* Upcoming Bills */}
          <div className="col-span-1 lg:col-span-2">
            <UpcomingBills accounts={accounts} />
          </div>

          {/* Alerts */}
          <div className="col-span-1 lg:col-span-2">
            <FinancialAlerts transactions={txns} />
          </div>

          {/* Transactions List */}
          <div className="col-span-1 lg:col-span-2">
            <TransactionsList transactions={txns} />
          </div>

          {/* Subscription Card */}
          <div id="subscriptions-section" className="col-span-1 lg:col-span-2">
            <SubscriptionCard />
          </div>
        </div>
      </section>

      <BottomBar />
    </main>
  );
}
