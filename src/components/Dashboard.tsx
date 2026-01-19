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
    { id: "balance-summary", title: "Where you stand", description: "Review key balances at a glance." },
    { id: "forecast", title: "Forecast", description: "See your projected balance trend and recent momentum." },
    {
      id: "tools",
      title: "Tools",
      description: "Compact tiles on mobile so more fits on screen.",
      mobileHint: "Tiles are in a 2-column grid on iPhone for a cleaner layout.",
    },
    { id: "transactions", title: "Transactions", description: "Filter and search your latest activity." },
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
        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
      >
        My profile
      </a>
    ) : null;

  const SectionShell: React.FC<{ children: React.ReactNode; tourId?: string }> = ({ children, tourId }) => (
    <section
      data-tour-id={tourId}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1F0051]/25 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="relative p-4 sm:p-6">{children}</div>
    </section>
  );

  const TileShell: React.FC<{ children: React.ReactNode; tourId?: string }> = ({ children, tourId }) => (
    <div
      data-tour-id={tourId}
      className="hover-zoom relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur"
    >
      <div className="relative p-3 sm:p-5">{children}</div>
    </div>
  );

  if (dataLoading && !hasData) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Dashboard</p>
            <h1 className="text-xl font-semibold text-white">Overview</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {profileLink}
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
            >
              Refresh bank data
            </button>
          </div>
        </div>

        <div className="flex h-[52vh] flex-col items-center justify-center gap-3 text-white/60">
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
              className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
            >
              Refresh bank data
            </button>

            {!connectionPending && (
              <button
                type="button"
                onClick={handleConnectBank}
                disabled={connecting}
                className="relative overflow-hidden rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Dashboard</p>
            <h1 className="text-xl font-semibold text-white">Overview</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profileLink}
            {!connectionPending && (
              <button
                type="button"
                onClick={handleConnectBank}
                disabled={connecting}
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40 disabled:opacity-60"
              >
                Connect bank
              </button>
            )}
          </div>
        </div>

        <div className="flex h-[52vh] flex-col items-center justify-center gap-3 text-white/60">
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Dashboard</p>
            <h1 className="text-xl font-semibold text-white">Overview</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profileLink}
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
            >
              Refresh bank data
            </button>
          </div>
        </div>

        <div className="flex h-[52vh] flex-col items-center justify-center gap-3 text-white/60">
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
                className="interactive-primary rounded-2xl bg-[#1F0051] px-6 py-3 text-xs font-semibold text-white disabled:opacity-60"
              >
                {connecting ? "Starting…" : "Connect bank"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
            >
              Refresh bank data
            </button>
          )}
        </div>
      </div>
    );
  }

  const subscriptionTeaser = subscriptionSummary.length
    ? `Found ${subscriptionSummary.length} subscriptions • ${formatCurrency(subscriptionTotal, region)} / month`
    : "Connect a bank to discover recurring services.";

  const cashflowTeaser = monthlyStats.income
    ? `Income ${formatCurrency(monthlyStats.income, region)} vs spend ${formatCurrency(monthlyStats.expenses, region)}`
    : "Link your accounts to calculate monthly cashflow.";

  return (
    <div className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-5 sm:gap-7">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Dashboard</p>
          <h1 className="text-xl font-semibold text-white">Overview</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profileLink}

          <button
            type="button"
            onClick={handleConnectBank}
            disabled={connecting}
            className="relative overflow-hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {connectError && <p className="w-full text-xs text-red-300">{connectError}</p>}
      </div>

      {error && hasData && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-200 shadow-sm">
          {error}
        </div>
      )}

      {/* Top hero: forecast + balances */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3" data-tour-id="forecast">
          <SectionShell>
            <SpendingForecast accounts={accounts} transactions={transactions} region={region} />
          </SectionShell>
        </div>

        <div className="lg:col-span-2 grid gap-4">
          <SectionShell tourId="balance-summary">
            <BalanceSummary accounts={accounts} transactions={transactions} region={region} />
          </SectionShell>

          <SectionShell>
            <SpendingCategoriesWidget transactions={transactions} region={region} />
          </SectionShell>
        </div>
      </div>

      {/* Compact tools grid (2-column on iPhone) */}
      <section className="flex flex-col gap-3" data-tour-id="tools">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Tools</p>
            <h2 className="text-base font-semibold text-white">Build your plan</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <TileShell>
            <PlanGate feature="Subscription Hunter" teaser={subscriptionTeaser} dataTourId="subscription-hunter">
              <SubscriptionHunter transactions={transactions} region={region} />
            </PlanGate>
          </TileShell>

          <TileShell tourId="cashflow">
            <PlanGate feature="Cashflow monthly" teaser={cashflowTeaser} dataTourId="cashflow">
              <CashflowMini transactions={transactions} region={region} />
            </PlanGate>
          </TileShell>

          <TileShell>
            <PlanGate feature="Upcoming bills" teaser="Upgrade to predict upcoming bills and due dates." dataTourId="upcoming-bills">
              <UpcomingBills accounts={accounts} />
            </PlanGate>
          </TileShell>

          <TileShell tourId="financial-health">
            <PlanGate feature="Financial health" teaser="Upgrade to unlock health scoring and deeper insights." dataTourId="financial-health">
              <FinancialHealthCard transactions={transactions} region={region} />
            </PlanGate>
          </TileShell>

          <div className="col-span-2 lg:col-span-1">
            <TileShell tourId="transactions">
              <PlanGate feature="Transactions" teaser="Unlock full transaction history with AI filters." dataTourId="transactions">
                <TransactionsList transactions={transactions} />
              </PlanGate>
            </TileShell>
          </div>
        </div>
      </section>

      {lastUpdated && (
        <p className="text-center text-[11px] text-slate-400">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
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

      <AiAssistant region={region} accounts={accounts} transactions={transactions} lastUpdated={lastUpdated} />
    </div>
  );
};

export default Dashboard;
