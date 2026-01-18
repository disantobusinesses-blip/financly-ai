import React, { useEffect, useMemo, useState } from "react";
import FinancialHealthCard from "./FinancialHealthCard";
import BalanceSummary from "./BalanceSummary";
import SubscriptionHunter, { deriveSubscriptionSummary } from "./SubscriptionHunter";
import CashflowMini from "./CashflowMini";
import UpcomingBills from "./UpcomingBills";
import TransactionsList from "./TransactionsList";
import SpendingForecast from "./SpendingForecast";
import PlanGate from "./PlanGate";
import DashboardTour, { TourStep } from "./DashboardTour";
import TutorialButton from "./TutorialButton";
import LegalFooter from "./LegalFooter";
import { useFiskilData } from "../hooks/useFiskilData";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import type { Transaction } from "../types";
import SyncingOverlay from "./SyncingOverlay";
import AiAssistant from "./AiAssistant";
import SpendingCategoriesWidget from "./SpendingCategoriesWidget";

const TOUR_KEY = "myaibank_tour_seen";
const LEGACY_TOUR_KEY = "financly_tour_seen";

const Dashboard: React.FC = () => {
  const { user, profile, session, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (!user) return;
    const seenTour = localStorage.getItem(TOUR_KEY) ?? localStorage.getItem(LEGACY_TOUR_KEY);
    if (!seenTour && (accounts.length > 0 || transactions.length > 0)) {
      setTourOpen(true);
      localStorage.setItem(TOUR_KEY, "1");
      localStorage.removeItem(LEGACY_TOUR_KEY);
    }
  }, [accounts.length, transactions.length, user]);

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
    { id: "forecast-hero", title: "Forecast", description: "Your cashflow trend and 6-month projection." },
    { id: "balance-summary", title: "Where you stand", description: "Review key balances at a glance." },
    { id: "spending-categories", title: "Categories", description: "See where your money goes." },
    { id: "financial-health", title: "Cashflow precision", description: "Track income vs outgoings each month." },
    { id: "tool-grid", title: "Tools", description: "Tap a tile to explore subscription and cashflow tools." },
    { id: "transactions", title: "Transactions", description: "Browse your latest activity." },
  ];

  useEffect(() => {
    if (!authLoading && !session) {
      window.location.href = "/login";
    }
  }, [authLoading, session]);

  // DO NOT CHANGE: stable consent session route
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

  const hasData = accounts.length > 0 || transactions.length > 0;
  const debugBlock = debugInfo ? JSON.stringify(debugInfo, null, 2) : null;
  const connectionPending =
    connected || syncStatus.stage === "awaiting_accounts" || syncStatus.stage === "awaiting_transactions";

  const profileLink =
    user && profile?.is_onboarded ? (
      <a
        href="/app/profile"
        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
      >
        My profile
      </a>
    ) : null;

  const SectionShell: React.FC<{ children: React.ReactNode; tourId?: string; className?: string }> = ({
    children,
    tourId,
    className,
  }) => (
    <section
      data-tour-id={tourId}
      className={[
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur",
        className || "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1F0051]/25 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="relative p-5 sm:p-6">{children}</div>
    </section>
  );

  const HeaderRow: React.FC = () => (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Dashboard</p>
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {profileLink}

        <button
          type="button"
          onClick={handleConnectBank}
          disabled={connecting}
          className="relative overflow-hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={connecting ? "opacity-0" : "opacity-100"}>Connect bank</span>
          {connecting && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="connect-loading-track">
                <span className="connect-loading-bar" />
              </span>
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
        >
          Refresh bank data
        </button>
      </div>

      {connectError && <p className="text-sm text-red-400">{connectError}</p>}
    </div>
  );

  if (dataLoading && !hasData) {
    return (
      <div className="flex flex-col gap-8">
        <HeaderRow />

        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-white/60">
          <SyncingOverlay
            open
            title={syncStatus.stage === "awaiting_transactions" ? "Loading transactions" : "Loading bank data"}
            message={syncStatus.message || "Fetching accounts and transactions from Fiskil…"}
            progress={typeof syncStatus.progress === "number" ? syncStatus.progress : 10}
            details={debugBlock || undefined}
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
            >
              Refresh bank data
            </button>

            {!connectionPending && (
              <button
                type="button"
                onClick={handleConnectBank}
                disabled={connecting}
                className="relative overflow-hidden rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className={connecting ? "opacity-0" : "opacity-100"}>Connect bank</span>
                {connecting && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="connect-loading-track">
                      <span className="connect-loading-bar" />
                    </span>
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="flex flex-col gap-8">
        <HeaderRow />

        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-white/60">
          <p className="text-red-400">{error}</p>
          {debugBlock && (
            <pre className="mt-2 max-h-56 w-full max-w-2xl overflow-auto rounded-xl bg-black/70 p-4 text-xs text-white/80">
              {debugBlock}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex flex-col gap-8">
        <HeaderRow />

        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-white/60">
          <SyncingOverlay
            open={connectionPending}
            title="Connection successful"
            message={syncStatus.message || "Waiting for bank data…"}
            progress={typeof syncStatus.progress === "number" ? syncStatus.progress : 35}
            details={debugBlock || undefined}
          />
          {!connectionPending ? (
            <>
              <p>No data yet. Connect your bank to see your dashboard.</p>
              <button
                type="button"
                onClick={handleConnectBank}
                disabled={connecting}
                className="interactive-primary rounded-2xl bg-[#1F0051] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {connecting ? "Starting…" : "Connect bank"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
            >
              Refresh bank data
            </button>
          )}
        </div>
      </div>
    );
  }

  const subscriptionTeaser = subscriptionSummary.length
    ? `Found ${subscriptionSummary.length} subs. Est. ${formatCurrency(subscriptionTotal, region)} / mo.`
    : "Connect a bank to discover recurring services.";

  const cashflowTeaser = monthlyStats.income
    ? `Income ${formatCurrency(monthlyStats.income, region)} vs spend ${formatCurrency(monthlyStats.expenses, region)}.`
    : "Link your accounts to calculate monthly cashflow.";

  // Tools: designed to be a 2x2 grid on iPhone; expands on desktop.
  const toolCards = [
    {
      key: "forecast",
      title: "Forecast",
      element: (
        <PlanGate feature="Account forecast" teaser="Upgrade to view forecasts." dataTourId="forecast">
          <SpendingForecast accounts={accounts} transactions={transactions} region={region} />
        </PlanGate>
      ),
    },
    {
      key: "subscriptions",
      title: "Subscription Hunter",
      element: (
        <PlanGate feature="Subscription Hunter" teaser={subscriptionTeaser} dataTourId="subscription-hunter">
          <SubscriptionHunter transactions={transactions} region={region} />
        </PlanGate>
      ),
    },
    {
      key: "cashflow",
      title: "Cashflow",
      element: (
        <PlanGate feature="Cashflow monthly" teaser={cashflowTeaser} dataTourId="cashflow">
          <CashflowMini transactions={transactions} region={region} />
        </PlanGate>
      ),
    },
    {
      key: "bills",
      title: "Upcoming bills",
      element: (
        <PlanGate feature="Upcoming bills" teaser="Upgrade to predict upcoming bills." dataTourId="upcoming-bills">
          <UpcomingBills accounts={accounts} />
        </PlanGate>
      ),
    },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-[480px] flex-col gap-7 px-4 sm:max-w-screen-2xl sm:gap-10 sm:px-6 lg:gap-12 lg:px-10">
      <HeaderRow />

      {error && hasData && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 shadow-sm">
          {error}
        </div>
      )}

      {/* HERO: Forecast first (main feature) */}
      <SectionShell tourId="forecast-hero" className="overflow-hidden">
        <SpendingForecast accounts={accounts} transactions={transactions} region={region} />
      </SectionShell>

      {/* KPI / balance summary (still valuable, below forecast) */}
      <SectionShell tourId="balance-summary">
        <BalanceSummary accounts={accounts} transactions={transactions} region={region} />
      </SectionShell>

      {/* Categories + Health in a responsive grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionShell tourId="spending-categories">
          <SpendingCategoriesWidget transactions={transactions} region={region} />
        </SectionShell>

        <SectionShell tourId="financial-health">
          <FinancialHealthCard transactions={transactions} region={region} />
        </SectionShell>
      </div>

      {/* Tools: 2x2 tiles on iPhone; grid expands on desktop */}
      <section className="flex flex-col gap-4" data-tour-id="tool-grid">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Tools</p>
            <h2 className="text-lg font-semibold text-white">Build your plan</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-2">
          {toolCards.map((tool) => (
            <div
              key={tool.key}
              className="hover-zoom rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur"
            >
              <div className="p-4 sm:p-5">{tool.element}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Transactions full width */}
      <SectionShell tourId="transactions">
        <PlanGate feature="Transactions" teaser="Unlock full transaction history with AI filters.">
          <TransactionsList transactions={transactions} />
        </PlanGate>
      </SectionShell>

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

      {/* AI assistant always mounted */}
      <AiAssistant region={region} accounts={accounts} transactions={transactions} lastUpdated={lastUpdated} />
    </div>
  );
};

export default Dashboard;
