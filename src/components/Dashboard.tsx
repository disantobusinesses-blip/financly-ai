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

function BottomBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur border-t"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
    >
      <div className="mx-auto max-w-screen-xl px-3 py-2 grid grid-cols-3 gap-2 text-xs">
        <a href="/" className="text-center rounded-md border py-2">Home</a>
        <a href="/connect" className="text-center rounded-md border py-2">Connect</a>
        <a href="/upgrade" className="text-center rounded-md border py-2">Upgrade</a>
      </div>
    </nav>
  );
}

export default function Dashboard() {
  // TODO: replace with logged-in user ID from your auth/session
  const userId = "demo-user";
  const { accounts, transactions, loading } = useBasiqData(userId);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const savingsPlan = null; // safe placeholder, matches SpendingForecast type

  if (loading) {
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
              transactions={transactions}
              totalBalance={totalBalance}
              savingsPlan={savingsPlan}
            />
          </div>

          {/* Transaction Analysis (Subscription Hunter lives inside) */}
          <div className="col-span-2 lg:col-span-3">
            <TransactionAnalysis transactions={transactions} />
          </div>

          {/* Balance + Accounts */}
          <div className="col-span-2 lg:col-span-2">
            <BalanceSummary accounts={accounts} />
          </div>

          {/* Cashflow mini chart */}
          <div className="col-span-1 lg:col-span-2">
            <CashflowMini transactions={transactions} />
          </div>

          {/* Spending breakdown */}
          <div className="col-span-1 lg:col-span-2">
            <SpendingByCategory transactions={transactions} />
          </div>

          {/* Spending chart (pie) */}
          <div className="col-span-1 lg:col-span-2">
            <SpendingChart transactions={transactions} />
          </div>

          {/* Bills */}
          <div className="col-span-1 lg:col-span-2">
            <UpcomingBills accounts={accounts} />
          </div>

          {/* Alerts */}
          <div className="col-span-1 lg:col-span-2">
            <FinancialAlerts transactions={transactions} />
          </div>

          {/* Transactions list */}
          <div className="col-span-1 lg:col-span-2">
            <TransactionsList transactions={transactions} />
          </div>

          {/* Subscription card */}
          <div className="col-span-1 lg:col-span-2">
            <SubscriptionCard />
          </div>
        </div>
      </section>

      <BottomBar />
    </main>
  );
}
