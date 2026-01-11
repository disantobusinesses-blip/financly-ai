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
import { useFiskilData } from "../hooks/useFiskilData";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import type { Transaction } from "../types";
import SyncingOverlay from "./SyncingOverlay";

const TOUR_KEY = "myaibank_tour_seen";
const LEGACY_TOUR_KEY = "financly_tour_seen";

const Dashboard: React.FC = () => {
  const { user, session, loading: authLoading } = useAuth();
  const region = user?.region ?? "AU";

  const {
    accounts,
    transactions,
    loading: dataLoading,
    error,
    lastUpdated,
    connected,
    debugInfo,
    syncStatus,
    refresh,
  } = useFiskilData(user?.id);

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

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
    if (!seenTour && (accounts.length > 0 || transactions.length > 0)) {
      setTourOpen(true);
      localStorage.setItem(TOUR_KEY, "1");
      localStorage.removeItem(LEGACY_TOUR_KEY);
    }
  }, [accounts.length, transactions.length, user]);

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
  const subscriptionTotal = subscriptionSummary.reduce((sum: number, item) => sum + item.total, 0);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    const recent = transactions.filter((tx: Transaction) => {
      const date = new Date(tx.date);
      return !Number.isNaN(date.getTime()) && date >= start;
    });

    const income = recent
      .filter((tx: Transaction) => tx.amount > 0)
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

    const expenses = Math.abs(
      recent
        .filter((tx: Transaction) => tx.amount < 0)
        .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0)
    );

    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const tourSteps: TourStep[] = [
    { id: "balance-summary", title: "Where you stand", description: "Review key balances at a glance." },
    { id: "financial-health", title: "Financial health", description: "See your health score and guidance." },
    { id: "goal-planner", title: "Goal planner", description: "Track progress across your goals." },
    { id: "refer-a-friend", title: "Refer & save", description: "Share your link to unlock discounts." },
    {
      id: "subscription-hunter",
      title: "Subscription Hunter",
      description: "AI groups repeat merchants and shows how often they bill you.",
      mobileHint: "Swipe right to reveal more tools on mobile.",
    },
    { id: "cashflow", title: "Cashflow", description: "Monitor break-even trends and savings projections." },
    { id: "transactions", title: "Transactions", description: "Filter and search your latest activity." },
  ];

  useEffect(() => {
    if (!authLoading && !session) {
      window.location.href = "/login";
    }
  }, [authLoading, session]);

  const handleConnectBank = async (): Promise<void> => {
    setConnectError(null);
    setConnecting(true);

    try {
      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/create-consent-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: session.user.email }),
      });

      const text = await response.text();
      let payload: Record<string, unknown> = {};
      try {
        payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        payload = {};
      }

      if (!response.ok) {
        const serverErr = typeof payload.error === "string" ? payload.error : null;
        throw new Error(serverErr || text || "Unable to start bank connection.");
      }

      const authUrl = typeof payload.auth_url === "string" ? payload.auth_url : undefined;
      const requestError = typeof payload.error === "string" ? payload.error : null;

      if (authUrl) {
        window.location.href = authUrl;
        return;
      }

      throw new Error(requestError || "Missing auth URL from consent session.");
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Unable to connect bank right now.");
    } finally {
      setConnecting(false);
    }
  };

  const ConnectBankCTA = (
    <div className="flex flex-col items-center justify-center gap-3">
      <button
        type="button"
        onClick={handleConnectBank}
        disabled={connecting}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-white dark:hover:border-white/60"
      >
        {connecting ? "Connecting..." : "Connect bank"}
      </button>
      {connectError && <p className="text-sm text-red-500 text-center">{connectError}</p>}
    </div>
  );

  const hasData = accounts.length > 0 || transactions.length > 0;
  const debugBlock = debugInfo ? JSON.stringify(debugInfo, null, 2) : null;

  if (dataLoading && !hasData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
        <SyncingOverlay
          open
          title={syncStatus.stage === "awaiting_transactions" ? "Loading transactions" : "Loading bank data"}
          message={syncStatus.message || "Fetching accounts and transactions from Fiskil…"}
          progress={typeof syncStatus.progress === "number" ? syncStatus.progress : 10}
          details={debugBlock || undefined}
        />
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white"
        >
          Refresh bank data
        </button>
        {!connected && ConnectBankCTA}
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
        <p className="text-red-500">{error}</p>
        {debugBlock && (
          <pre className="mt-2 max-h-56 w-full max-w-2xl overflow-auto rounded-xl bg-slate-950/80 p-4 text-xs text-slate-100">
            {debugBlock}
          </pre>
        )}
        {ConnectBankCTA}
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
        <SyncingOverlay
          open={connected}
          title="Connection successful"
          message={syncStatus.message || "Waiting for bank data…"}
          progress={typeof syncStatus.progress === "number" ? syncStatus.progress : 35}
          details={debugBlock || undefined}
        />
        {!connected ? (
          <>
            <p>No data yet. Connect your bank to see your dashboard.</p>
            {ConnectBankCTA}
          </>
        ) : (
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white"
          >
            Refresh bank data
          </button>
        )}
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
    ? `Income ${formatCurrency(monthlyStats.income, region)} vs spend ${formatCurrency(
        monthlyStats.expenses,
        region
      )}.`
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
        <PlanGate
          feature="Spending forecast"
          teaser="Upgrade to view AI cashflow scenarios."
          dataTourId="forecast"
        >
          <SpendingForecast transactions={transactions} region={region} />
        </PlanGate>
      ),
    },
    {
      key: "upcoming-bills",
      element: (
        <PlanGate
          feature="Upcoming bills"
          teaser="Upgrade to predict upcoming bills and due dates."
          dataTourId="upcoming-bills"
        >
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleConnectBank}
          disabled={connecting}
          className="self-end rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-white dark:hover:border-white/60"
        >
          {connecting ? "Connecting..." : "Connect bank"}
        </button>

        <button
          type="button"
          onClick={() => void refresh()}
          className="self-end rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/15 disabled:opacity-60"
        >
          Refresh bank data
        </button>

        {connectError && <p className="text-sm text-red-500 sm:text-right">{connectError}</p>}
      </div>

      {error && hasData && (
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

      <LegalFooter />
    </div>
  );
};

export default Dashboard;
