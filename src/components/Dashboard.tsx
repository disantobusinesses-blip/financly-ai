import React, { useEffect, useMemo, useState } from "react";
import SpendingForecast from "./SpendingForecast";
import BalanceSummary from "./BalanceSummary";
import SpendingCategoriesWidget from "./SpendingCategoriesWidget";
import DashboardTour, { TourStep } from "./DashboardTour";
import TutorialButton from "./TutorialButton";
import LegalFooter from "./LegalFooter";
import { useFiskilData } from "../hooks/useFiskilData";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import type { Account, Transaction } from "../types";
import SyncingOverlay from "./SyncingOverlay";
import AiAssistant from "./AiAssistant";

const TOUR_KEY = "myaibank_tour_seen";
const LEGACY_TOUR_KEY = "financly_tour_seen";

const pushAppRoute = (path: string) => {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
};

const sumBalances = (accounts: Account[]) =>
  accounts.reduce((sum, a) => sum + (Number.isFinite(a.balance) ? a.balance : 0), 0);

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

  const stage = (syncStatus as any)?.stage;
  const connectionPending =
    connected || stage === "awaiting_accounts" || stage === "awaiting_transactions";

  const profileLink =
    user && profile?.is_onboarded ? (
      <a
        href="/app/profile"
        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
      >
        My profile
      </a>
    ) : null;

  const totals = useMemo(() => {
    const totalCash = sumBalances(accounts);

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

    const net = income - expenses;

    const recurring = recent.filter((tx) => {
      const desc = (tx.description || "").toLowerCase();
      const cat = (tx.category || "").toLowerCase();
      const looksRecurring =
        cat.includes("subscription") ||
        cat.includes("recurring") ||
        desc.includes("netflix") ||
        desc.includes("spotify") ||
        desc.includes("apple") ||
        desc.includes("google") ||
        desc.includes("prime") ||
        desc.includes("membership");
      return tx.amount < 0 && looksRecurring;
    });

    const subsMonthly = Math.abs(recurring.reduce((sum, tx) => sum + tx.amount, 0));

    return { totalCash, income, expenses, net, subsMonthly };
  }, [accounts, transactions]);

  const tourSteps: TourStep[] = [
    { id: "forecast", title: "Cashflow forecast", description: "Tap to open the full forecast page." },
    { id: "tools", title: "Tiles", description: "Tap any tile to open the dedicated page." },
    { id: "balance-summary", title: "Where you stand", description: "Quick balances and cash overview." },
  ];

  const CardShell: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    tourId?: string;
    className?: string;
  }> = ({ children, onClick, tourId, className }) => {
    const clickable = Boolean(onClick);
    return (
      <section
        data-tour-id={tourId}
        onClick={onClick}
        className={[
          "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/50",
          clickable ? "cursor-pointer transition hover:border-white/20 hover:bg-[#101018]" : "",
          className ?? "",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1F0051]/25 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative p-4 sm:p-6">{children}</div>
      </section>
    );
  };

  const Tile: React.FC<{
    title: string;
    value: string;
    sub?: string;
    toneClass?: string;
    onClick: () => void;
  }> = ({ title, value, sub, toneClass, onClick }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] p-4 text-left shadow-2xl shadow-black/40 transition",
          "hover:border-white/20 hover:bg-[#101018]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div
            className={[
              "absolute -left-20 -top-20 h-60 w-60 rounded-full blur-3xl",
              toneClass ?? "bg-white/5",
            ].join(" ")}
          />
        </div>
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-white/75">{title}</p>
            <span className="text-white/50">→</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">VISIT PAGE</p>
          {sub ? <p className="mt-2 text-xs text-white/55">{sub}</p> : null}
        </div>
      </button>
    );
  };

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
              disabled={dataLoading}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b0b10] p-6 text-sm text-white/70">
          Syncing your bank data…
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-6">
      <SyncingOverlay open={connectionPending && dataLoading} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Dashboard</p>
          <h1 className="text-xl font-semibold text-white">Overview</h1>
          <p className="mt-1 text-sm text-white/60">Your financial insights</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profileLink}

          <button
            type="button"
            onClick={() => void handleConnectBank()}
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
            disabled={dataLoading}
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

      {/* Forecast hero (click to open /app/forecast) */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3" data-tour-id="forecast">
          <CardShell onClick={() => pushAppRoute("/app/forecast")} className="select-none">
            <SpendingForecast accounts={accounts} transactions={transactions} region={region} />
          </CardShell>
        </div>

        <div className="lg:col-span-2 grid gap-4">
          <CardShell tourId="balance-summary">
            <BalanceSummary accounts={accounts} transactions={transactions} region={region} />
          </CardShell>

          <CardShell onClick={() => pushAppRoute("/app/reports")} className="select-none">
            <SpendingCategoriesWidget transactions={transactions} region={region} />
          </CardShell>
        </div>
      </div>

      {/* Clickable tiles (2-column on iPhone) */}
      <section className="flex flex-col gap-3" data-tour-id="tools">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Tools</p>
          <h2 className="text-base font-semibold text-white">Tap a tile to open the page</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Tile
            title="Where you stand"
            value={formatCurrency(totals.totalCash, region)}
            sub="Total cash"
            toneClass="bg-white/5"
            onClick={() => pushAppRoute("/app/dashboard")}
          />

          <Tile
            title="Income"
            value={formatCurrency(totals.income, region)}
            sub="Last 30 days"
            toneClass="bg-emerald-500/15"
            onClick={() => pushAppRoute("/app/transactions")}
          />

          <Tile
            title="Expenses"
            value={formatCurrency(totals.expenses, region)}
            sub="Last 30 days"
            toneClass="bg-sky-500/15"
            onClick={() => pushAppRoute("/app/transactions")}
          />

          <Tile
            title="Subscriptions"
            value={formatCurrency(totals.subsMonthly, region)}
            sub="Estimated monthly"
            toneClass="bg-violet-500/15"
            onClick={() => pushAppRoute("/app/subscriptions")}
          />

          <Tile
            title="Budget"
            value={formatCurrency(totals.net, region)}
            sub={totals.net >= 0 ? "Surplus (last 30 days)" : "Deficit (last 30 days)"}
            toneClass="bg-emerald-500/10"
            onClick={() => pushAppRoute("/app/cashflow")}
          />

          <Tile
            title="Reports"
            value="Insights"
            sub="Breakdowns & trends"
            toneClass="bg-purple-500/10"
            onClick={() => pushAppRoute("/app/reports")}
          />

          <div className="col-span-2 lg:col-span-2">
            <button
              type="button"
              onClick={() => pushAppRoute("/app/transactions")}
              className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] p-4 text-left shadow-2xl shadow-black/40 transition hover:border-white/20 hover:bg-[#101018]"
            >
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1F0051]/20 blur-3xl" />
              </div>
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-white/75">Search transactions</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Open ledger</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">VISIT PAGE</p>
                </div>
                <span className="text-white/50">→</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {lastUpdated && (
        <p className="text-center text-[11px] text-slate-400">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
      )}

      {debugBlock ? (
        <details className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70">
          <summary className="cursor-pointer select-none font-semibold text-white/80">Debug info</summary>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words">{debugBlock}</pre>
        </details>
      ) : null}

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