import BalanceSummary from "./BalanceSummary";
import CashflowMini from "./CashflowMini";
import SpendingByCategory from "./SpendingByCategory";
import UpcomingBills from "./UpcomingBills";
import SubscriptionCard from "./SubscriptionCard";
import QuickActions from "./QuickActions";

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
    <main className="min-h-screen bg-gray-50">
      <header
        className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
      >
        <div className="mx-auto max-w-screen-xl px-3 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Financly</h1>
          <QuickActions />
        </div>
      </header>

      <section
        className="mx-auto max-w-screen-xl px-3 py-3"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 grid-flow-row-dense">
          <div className="col-span-2 lg:col-span-2"><BalanceSummary /></div>
          <div className="col-span-1 lg:col-span-2"><CashflowMini /></div>
          <div className="col-span-1 lg:col-span-2"><SpendingByCategory /></div>
          <div className="col-span-1 lg:col-span-2"><UpcomingBills /></div>
          <div className="col-span-1 lg:col-span-2"><SubscriptionCard /></div>
        </div>
      </section>

      <BottomBar />
    </main>
  );
}
