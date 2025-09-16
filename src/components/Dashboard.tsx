import BalanceSummary from "./widgets/BalanceSummary";
import CashflowMini from "./widgets/CashflowMini";
import SpendingByCategory from "./widgets/SpendingByCategory";
import UpcomingBills from "./widgets/UpcomingBills";
import SubscriptionCard from "./widgets/SubscriptionCard";
import QuickActions from "./widgets/QuickActions";

/** Bottom bar inside this file to avoid extra files */
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
      {/* Sticky header with iPhone notch padding */}
      <header
        className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
      >
        <div className="mx-auto max-w-screen-xl px-3 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Financly</h1>
          <QuickActions />
        </div>
      </header>

      {/* Content padding-bottom so it never hides behind bottom bar */}
      <section
        className="mx-auto max-w-screen-xl px-3 py-3"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        {/* Dense, phone-first grid: 2 cols on iPhone, 3 on md, 6 on lg */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 grid-flow-row-dense">
          {/* Wide hero card first */}
          <div className="col-span-2 lg:col-span-2">
            <BalanceSummary />
          </div>

          {/* Two-up cards to minimize scroll */}
          <div className="col-span-1 lg:col-span-2">
            <CashflowMini />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <SpendingByCategory />
          </div>

          <div className="col-span-1 lg:col-span-2">
            <UpcomingBills />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <SubscriptionCard />
          </div>
        </div>
      </section>

      <BottomBar />
    </main>
  );
}