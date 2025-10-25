import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FinancialWellnessCard from "./FinancialWellnessCard";
import GoalPlanner from "./GoalPlanner";
import BalanceSummary from "./BalanceSummary";
import SubscriptionHunter, { deriveSubscriptionSummary } from "./SubscriptionHunter";
import CashflowMini from "./CashflowMini";
import SpendingByCategory from "./SpendingByCategory";
import SpendingChart from "./SpendingChart";
import UpcomingBills from "./UpcomingBills";
import FinancialAlerts from "./FinancialAlerts";
import TransactionsList from "./TransactionsList";
import TransactionAnalysis from "./TransactionAnalysis";
import SpendingForecast from "./SpendingForecast";
import PlanGate from "./PlanGate";
import DashboardTour, { TourStep } from "./DashboardTour";
import TutorialButton from "./TutorialButton";
import { ArrowRightIcon } from "./icon/Icon";
import { useBasiqData } from "../hooks/useBasiqData";
import { useAuth } from "../contexts/AuthContext";
import { useGeminiAI } from "../hooks/useGeminiAI";
import { formatCurrency } from "../utils/currency";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const region = user?.region ?? "AU";
  const { accounts, transactions, loading, error, lastUpdated } = useBasiqData(user?.id);
  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
  const aiData = useGeminiAI(transactions, totalBalance, region);

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const [railScrollState, setRailScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

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
      const amount = el.clientWidth * 0.9;
      el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
      window.setTimeout(updateRailScrollState, 350);
    },
    [updateRailScrollState]
  );

  useEffect(() => {
    if (!user) return;
    const seenTour = localStorage.getItem("financly_tour_seen");
    if (!seenTour && accounts.length > 0) {
      setTourOpen(true);
      localStorage.setItem("financly_tour_seen", "1");
    }
  }, [accounts.length, user]);

  useEffect(() => {
    updateRailScrollState();
  }, [updateRailScrollState, accounts.length, transactions.length]);

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
    return {
      income,
      expenses,
      net: income - expenses,
    };
  }, [transactions]);

  const tourSteps: TourStep[] = [
    {
      id: "financial-wellness",
      title: "Wellness score",
      description: "See your debt-to-income ratio, savings split, and monthly snapshot updated in real time.",
    },
    {
      id: "goal-planner",
      title: "Goal planner",
      description: "Create goals after funding them at your bank, then we track progress and celebrate contributions.",
    },
    {
      id: "balance-summary",
      title: "Balance summary",
      description: "Spending availability vs. net worth and mortgages all in one glance.",
    },
    {
      id: "subscription-hunter",
      title: "Subscription Hunter",
      description: "AI groups repeat merchants and shows how often they bill you.",
      mobileHint: "Swipe right to reveal more tools on mobile.",
    },
    {
      id: "cashflow",
      title: "Cashflow & categories",
      description: "Monitor break-even trends and where your dollars go each month.",
    },
    {
      id: "alerts",
      title: "AI alerts",
      description: "Gemini flags anomalies, opportunities, and reminders. Always includes a disclaimer.",
    },
    {
      id: "transactions",
      title: "Transaction analyst",
      description: "Filter, search, and let AI summarise your history with upgrade-only extras.",
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
    ? `We found ${subscriptionSummary.length} subscriptions and ${formatCurrency(
        subscriptionTotal,
        region
      )} you can save on.`
    : "Connect a bank to discover recurring services.";
  const cashflowTeaser = monthlyStats.income
    ? `Income ${formatCurrency(monthlyStats.income, region)} vs spend ${formatCurrency(monthlyStats.expenses, region)}.`
    : "Link your accounts to calculate monthly cashflow.";
  const alertsTeaser = aiData.alerts.length
    ? `${aiData.alerts.length} alerts queued. Upgrade to read them.`
    : "AI alerts ready once your bank sync completes.";
  const analysisTeaser = aiData.insights?.insights.length
    ? `${aiData.insights.insights.length} AI notes waiting inside transaction analysis.`
    : "Upgrade to unlock AI commentary on every transaction.";

  const pinnedCards = [
    {
      key: "goal-planner",
      element: <GoalPlanner accounts={accounts} transactions={transactions} />,
    },
    {
      key: "balance-summary",
      element: <BalanceSummary accounts={accounts} />,
    },
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
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <CashflowMini transactions={transactions} />
          </div>
        </PlanGate>
      ),
    },
    {
      key: "spending-category",
      element: (
        <PlanGate
          feature="Spending by category"
          teaser="Unlock AI to reveal your highest spending categories."
          dataTourId="spending-category"
        >
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <SpendingByCategory transactions={transactions} />
          </div>
        </PlanGate>
      ),
    },
    {
      key: "spending-forecast",
      element: (
        <PlanGate
          feature="Spending forecast"
          teaser="Upgrade to view AI cashflow scenarios."
          dataTourId="forecast"
        >
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <SpendingForecast transactions={transactions} totalBalance={totalBalance} savingsPlan={null} />
          </div>
        </PlanGate>
      ),
    },
    {
      key: "spending-trends",
      element: (
        <PlanGate
          feature="Category trends"
          teaser="Unlock visual trends with AI commentary."
          dataTourId="category-trends"
        >
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <SpendingChart transactions={transactions} />
          </div>
        </PlanGate>
      ),
    },
    {
      key: "alerts",
      element: (
        <PlanGate feature="AI alerts" teaser={alertsTeaser} dataTourId="alerts">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <FinancialAlerts transactions={transactions} />
          </div>
        </PlanGate>
      ),
    },
    {
      key: "upcoming-bills",
      element: (
        <PlanGate feature="Upcoming bills" teaser="Upgrade to predict upcoming bills and due dates." dataTourId="upcoming-bills">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <UpcomingBills accounts={accounts} />
          </div>
        </PlanGate>
      ),
    },
    {
      key: "transactions",
      element: (
        <PlanGate
          feature="Transactions"
          teaser="Unlock full transaction history with AI filters."
          dataTourId="transactions"
        >
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <TransactionsList transactions={transactions} />
          </div>
        </PlanGate>
      ),
    },
    {
      key: "transaction-analysis",
      element: (
        <PlanGate feature="Transaction analysis" teaser={analysisTeaser} dataTourId="transaction-analysis">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <TransactionAnalysis transactions={transactions} />
          </div>
        </PlanGate>
      ),
    },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10 lg:gap-14">
      {error && accounts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 shadow-sm">
          {error}
        </div>
      )}
      <FinancialWellnessCard accounts={accounts} transactions={transactions} region={region} />

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
            className="flex gap-8 overflow-hidden px-12 py-2 scroll-smooth"
          >
            {featureCards.map(({ key, element }) => (
              <div key={key} className="w-[380px] max-w-full flex-shrink-0">
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
        <p className="text-center text-xs text-slate-400">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
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
    </div>
  );
};

export default Dashboard;
