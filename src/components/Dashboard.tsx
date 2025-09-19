import BalanceSummary from "./BalanceSummary";
import CashflowMini from "./CashflowMini";
import SpendingByCategory from "./SpendingByCategory";
import SpendingChart from "./SpendingChart";
import UpcomingBills from "./UpcomingBills";
import FinancialAlerts from "./FinancialAlerts";
import TransactionsList from "./TransactionsList";
import SubscriptionCard from "./SubscriptionCard";
import SpendingForecast from "./SpendingForecast";

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
  return (
    <main>
      <section
        className="mx-auto max-w-screen-xl px-3 py-3"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 grid-flow-row-dense">

          {/* SpendingForecast always on top */}
          <div className="col-span-2 lg:col-span-3"><SpendingForecast /></div>

          {/* Other widgets */}
          <div className="col-span-2 lg:col-span-2"><BalanceSummary /></div>
          <div className="col-span-1 lg:col-span-2"><CashflowMini /></div>
          <div className="col-span-1 lg:col-span-2"><SpendingByCategory /></div>
          <div className="col-span-1 lg:col-span-2"><SpendingChart /></div>
          <div className="col-span-1 lg:col-span-2"><UpcomingBills /></div>
          <div className="col-span-1 lg:col-span-2"><FinancialAlerts /></div>
          <div className="col-span-1 lg:col-span-2"><TransactionsList /></div>
          <div className="col-span-1 lg:col-span-2"><SubscriptionCard /></div>

        </div>
      </section>

      <BottomBar />
    </main>
  );
}
