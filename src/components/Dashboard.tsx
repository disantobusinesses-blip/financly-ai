import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FinancialHealthCard from "./FinancialHealthCard";
import GoalPlanner from "./GoalPlanner";
import BalanceSummary from "./BalanceSummary";
import ReferAFriendCard from "./ReferAFriendCard";
import SubscriptionHunter, { deriveSubscriptionSummary } from "./SubscriptionHunter";
import CashflowMini from "./CashflowMini";
import UpcomingBills from "./UpcomingBills";
import TransactionsList from "./TransactionsList";
import SpendingForecast from "./SpendingForecast";
import PlanGate from "./PlanGate";
import DashboardTour, { TourStep } from "./DashboardTour";
import TutorialButton from "./TutorialButton";
import LegalFooter from "./LegalFooter";
import { ArrowRightIcon } from "./icon/Icon";
import { useBasiqData } from "../hooks/useBasiqData";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

const TOUR_KEY = "myaibank_tour_seen";
const LEGACY_TOUR_KEY = "financly_tour_seen";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  // Hook now calls /api/fiskil-data internally (Fiskil-only)
  const { accounts, transactions, loading, error, lastUpdated } = useBasiqData(user?.id);

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const [railScrollState, setRailScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const updateRailScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setRailScrollState({
      canScrollLeft: el.scrollLeft > 8,
      canScrollRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }, []);

  const handleRailScroll = useCallback(
    (direction: "left" | "right") => {
      const el = railRef.current;
      if (!el) return;

      const slides = el.querySelectorAll<HTMLElement>("[data-tool-slide]");
      const style = window.getComputedStyle(el);
      const gapCandidate = style.columnGap && style.columnGap !== "normal" ? style.columnGap : style.gap;
      const parsedGap = gapCandidate ? parseFloat(gapCandidate) : 0;
      const gap = Number.isNaN(parsedGap) ? 0 : parsedGap;
      const slideWidth = slides.length > 0 ? slides[0].clientWidth : el.clientWidth;
      const amount = slideWidth + gap;

      el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
      window.setTimeout(updateRailScrollState, 350);
    },
    [updateRailScrollState]
  );

  useEffect(() => {
    if (!user) return;
    const seenTour = localStorage.getItem(TOUR_KEY) ?? localStorage.getItem(LEGACY_TOUR_KEY);
    if (!seenTour && accounts.length > 0) {
      setTourOpen(true);
      localStorage.setItem(TOUR_KEY, "1");
      localStorage.removeItem(LEGACY_TOUR_KEY);
    }
  }, [accounts.length, user]);

  useEffect(() => {
    updateRailScrollState();
  }, [updateRailScrollState, accounts.length, transactions.length]);

  useEffect(() => {
    window.addEventListener("resize", updateRailScrollState);
    return () => {
      window.removeEventListener("resize", updateRailScrollState);
    };
  }, [updateRailScrollState]);

  const subscriptionSummary = useMemo(() => deriveSubscriptionSummary(transactions), [transactions]);
  const subscriptionTotal = subscriptionSummary.reduce((sum, item) => sum + item.total, 0);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    const recent = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return !Number.isNaN(date.getTime()) && date >= start;
    });

    const income = recent.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = Math.abs(recent.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));

    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const tourSteps: TourStep[] = [
    {
      id: "balance-summary",
      title: "Where you stand",
      description: "Review spending-ready cash, net worth, and liabilities at a glance.",
    },
    {
      id: "financial-health",
      title: "Financial health",
      description: "See your health score, debt-to-income guidance, and savings split updated in real time.",
    },
    {
      id: "goal-planner",
      title: "Goal planner",
      description:
        "Create goals after funding them at your bank, then we track progress and celebrate contributions.",
    },
    {
      id: "refer-a-friend",
      title: "Refer & save",
      description: "Share your unique link to earn three months at 50% off once a friend upgrades.",
    },
    {
      id: "subscription-hunter",
      title: "Subscription Hunter",
      description: "AI groups repeat merchants and shows how often they bill you.",
      mobileHint: "Swipe right to reveal more tools on mobile.",
    },
    {
      id: "cashflow",
      title: "Cashflow",
      description: "Monitor break-even trends and monthly savings projections.",
    },
    {
      id: "transactions",
      title: "Transactions",
      description: "Filter and search your latest activity without leaving the dashboard.",
    },
  ];

  if (loading && accounts.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-500">
        <p>Loading your financial data...</p>
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-red-500">
        <p>Failed to load data: {error}</p>
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-slate-500">
        <p>No data yet. Connect your bank to see your dashboard.</p>
      </div>
    );
  }

  const subscriptionTeaser = subscriptionSummary.length
    ? `We found ${subscriptionSummary.length} subscriptions and ${formatCurrency(subscriptionTotal, region)} you can save on.`
    : "Connect a bank to discover recurring services.";

  const cashflowTeaser = monthlyStats.income
    ? `Income ${formatCurrency(monthlyStats.income, region)} vs spend ${formatCurrency(monthlyStats.expenses, region)}.`
    : "Link your accounts to calculate monthly cashflow.";

  const pinnedCards = [
    { key: "goal-planner", element: <GoalPlanner accounts={accounts} transactions={transactions} /> },
    { key: "refer", element: <ReferAFriendCard /> },
  ];

  const featureCards = [
    {
      key: "subscription-hunter",
      element: (
        <PlanGate feature="Subscription Hunter" teaser={subscriptionTeaser} dataTourId="subscription-hunter">
          <SubscriptionHunter transactions={transactions} region={region} />
        </PlanGate>
      ),
    },
    {
      key: "cashflow",
      element: (
        <PlanGate feature="Cashflow monthly" teaser={cashflowTeaser} dataTourId="cashflow">
          <CashflowMini transactions={transactions} region={region} />
        </PlanGate>
      ),
    },
    {
      key: "spending-forecast",
      element: (
        <PlanGate feature="Spending forecast" teaser="Upgrade to view AI cashflow scenarios." dataTourId="forecast">
          <SpendingForecast transactions={transactions} region={region} />
        </PlanGate>
      ),
    },
    {
      key: "upcoming-bills",
      element: (
        <PlanGate feature="Upcoming bills" teaser="Upgrade to predict upcoming bills and due dates." dataTourId="upcoming-bills">
          <UpcomingBills accounts={accounts} />
        </PlanGate>
      ),
    },
    {
      key: "transactions",
      element: (
        <PlanGate feature="Transactions" teaser="Unlock full transaction history with AI filters." dataTourId="transactions">
          <TransactionsList transactions={transactions} />
        </PlanGate>
      ),
    },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 sm:gap-10 sm:px-6 lg:gap-14 lg:px-10">
      {error && accounts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 shadow-sm">
          {error}
        </div>
      )}

      <BalanceSummary accounts={accounts} transactions={transactions} region={region} />
      <FinancialHealthCard accounts={accounts} transactions={transactions} region={region} />

      <div className="lg:hidden" data-tour-id="tool-carousel">
        <div className="tool-carousel">
          {[...pinnedCards, ...featureCards].map(({ key, element }) => (
            <div key={key}>{element}</div>
          ))}
        </div>
      </div>

      <div className="hidden flex-col gap-10 lg:flex">
        <div className="grid gap-10 lg:grid-cols-2">
          {pinnedCards.map(({ key, element }) => (
            <div key={key}>{element}</div>
          ))}
        </div>

        <div className="relative" data-tour-id="tool-carousel">
          <button
            type="button"
            onClick={() => handleRailScroll("left")}
            disabled={!railScrollState.canScrollLeft}
            className="absolute left-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-3 text-slate-600 shadow-lg transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
            aria-label="Scroll to previous tools"
          >
            <ArrowRightIcon className="h-5 w-5 -scale-x-100" />
          </button>

          <div
            ref={railRef}
            onScroll={updateRailScrollState}
            className="mx-auto flex w-full max-w-4xl snap-x snap-mandatory items-stretch gap-8 overflow-hidden px-10 py-4 scroll-smooth"
          >
            {featureCards.map(({ key, element }) => (
              <div key={key} data-tool-slide className="w-full flex-shrink-0 snap-center">
                {element}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleRailScroll("right")}
            disabled={!railScrollState.canScrollRight}
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-3 text-slate-600 shadow-lg transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
            aria-label="Scroll to more tools"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-center text-xs text-slate-400">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}

      <TutorialButton
        onClick={() => {
          setTourStep(0);
          setTourOpen(true);
        }}
      />

      <DashboardTour
        steps={tourSteps}
        isOpen={tourOpen}
        stepIndex={tourStep}
        onNext={() => setTourStep((s) => Math.min(s + 1, tourSteps.length - 1))}
        onBack={() => setTourStep((s) => Math.max(s - 1, 0))}
        onClose={() => setTourOpen(false)}
      />

      <LegalFooter />
    </div>
  );
};

export default Dashboard;