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
        <a href="/" className="text-center rounded-md border py-2">Home</a>
        <a href="/connect" className="text-center rounded-md border py-2">Connect</a>
        <a href="/upgrade" className="text-center rounded-md border py-2">Upgrade</a>
      </div>
    </nav>
  );
}

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
    <main>
      <section
        className="mx-auto max-w-screen-xl px-3 py-3"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left side */}
          <div className="lg:col-span-7 space-y-6">
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

          {/* Right side */}
          <div className="lg:col-span-5 space-y-6">
            <TransactionsList transactions={txns} />
            <FinancialAlerts transactions={txns} />
            <TransactionAnalysis transactions={txns} />
            <SubscriptionCard />
          </div>
        </div>
      </section>

      <BottomBar />
    </main>
  );
}
