import React, { useEffect, useMemo, useState } from "react";
import SpendingForecast from "./SpendingForecast";
import BalanceSummary from "./BalanceSummary";
import WeeklyOrdersPanel from "./WeeklyOrdersPanel";
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

const sumBalances = (accounts: Account[]) =>
  accounts.reduce((sum, a) => sum + (Number.isFinite(a.balance) ? a.balance : 0), 0);

const Dashboard: React.FC = () => {
  const { user, profile, session, loading: authLoading } = useAuth();
  const region = user?.region ?? "AU";

  // NOTE: useFiskilData signature is (userId)
  const {
    accounts,
    transactions,
    loading: dataLoading,
    error,
    lastUpdated,
    connected,
    syncStatus,
    debugInfo,
    refresh,
  } = useFiskilData(user?.id);

  const hasData = accounts.length > 0 || transactions.length > 0;

  const debugBlock = useMemo(() => {
    if (!debugInfo) return "";
    try {
      return JSON.stringify(debugInfo, null, 2);
    } catch {
      return String(debugInfo);
    }
  }, [debugInfo]);

  const totals = useMemo(() => {
    const totalCash = sumBalances(accounts);

    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);

    const recent = transactions.filter((tx: Transaction) => {
      const d = new Date(tx.date);
      return !Number.isNaN(d.getTime()) && d >= cutoff;
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
        desc.includes("subscription") ||
        desc.includes("monthly") ||
        desc.includes("netflix") ||
        desc.includes("spotify") ||
        cat.includes("subscription");
      return looksRecurring && tx.amount < 0;
    });

    const recurringTotal = Math.abs(recurring.reduce((sum, tx) => sum + tx.amount, 0));

    return {
      totalCash,
      income,
      expenses,
      net,
      recurringTotal,
    };
  }, [accounts, transactions]);

  const pushAppRoute = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        id: "forecast",
        title: "Cashflow forecast",
        description: "See where your balance is trending based on spending patterns.",
      },
      {
        id: "balance-summary",
        title: "Balance snapshot",
        description: "Quick view of cash positions across connected accounts.",
      },
      {
        id: "tools",
        title: "Quick launch tools",
        description: "Tap any tile to open the full page. Optimized for iPhone with two columns.",
      },
    ],
    []
  );

  useEffect(() => {
    const seen = window.localStorage.getItem(TOUR_KEY);
    if (!seen) {
      setTourOpen(true);
      setTourStep(0);
    }
  }, []);

  const markTourSeen = () => {
    window.localStorage.setItem(TOUR_KEY, "1");
  };

  const onTourClose = () => {
    setTourOpen(false);
    markTourSeen();
  };

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
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    );
  };

  const Tile: React.FC<{
    title: string;
    value: string;
    sub: string;
    toneClass?: string;
    onClick: () => void;
  }> = ({ title, value, sub, toneClass, onClick }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          "group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] px-4 py-4 text-left shadow-2xl shadow-black/40 transition hover:border-white/20 hover:bg-[#101018]",
          toneClass ?? "",
        ].join(" ")}
      >
        <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-2xl transition group-hover:bg-white/10" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">{title}</p>
          <p className="mt-2 text-lg font-semibold text-white">{value}</p>
          <p className="mt-1 text-[11px] text-white/50">{sub}</p>
        </div>
      </button>
    );
  };

  const canShowApp = Boolean(session && user);

  const profileLink =
    user && profile?.is_onboarded ? (
      <a
        href="/app/profile"
        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
      >
        My profile
      </a>
    ) : null;

  const stage = syncStatus.stage;

  const showConnectCTA = !connected || stage === "no_connection" || stage === "error";
  const connectLabel = connected ? "Manage connection" : "Connect bank";

  const overlayOpen =
    dataLoading && (stage === "awaiting_accounts" || stage === "awaiting_transactions") && hasData;

  if (authLoading) {
    return <div className="flex items-center justify-center py-16 text-sm text-white/70">Loading…</div>;
  }

  if (!canShowApp) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0b0b10] p-6 text-sm text-white/70">
        You’re not signed in.
      </div>
    );
  }

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
            {showConnectCTA ? (
              <button
                type="button"
                onClick={() => pushAppRoute("/onboarding")}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                {connectLabel}
              </button>
            ) : null}
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

        <div className="rounded-3xl border border-white/10 bg-[#0b0b10] p-6">
          <p className="text-sm text-white/70">{syncStatus.message || "Syncing your bank data…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-6">
      <SyncingOverlay
        open={overlayOpen}
        title="Syncing your bank data"
        message={syncStatus.message || "This may take a moment…"}
        progress={syncStatus.progress}
        details={debugBlock || undefined}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Dashboard</p>
          <h1 className="text-xl font-semibold text-white">Overview</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profileLink}

          {showConnectCTA ? (
            <button
              type="button"
              onClick={() => pushAppRoute("/onboarding")}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              disabled={dataLoading}
            >
              {connectLabel}
            </button>
          ) : null}

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

      {error && (
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

      {/* AI Operator: Weekly orders (click to open /app/weekly-orders) */}
      {user ? (
        <CardShell onClick={() => pushAppRoute("/app/weekly-orders")} className="select-none">
          <WeeklyOrdersPanel
            userId={user.id}
            region={region}
            transactions={transactions}
            accounts={accounts}
            totalBalance={totals.totalCash}
          />
        </CardShell>
      ) : null}

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
            sub="Past 30 days"
            onClick={() => pushAppRoute("/app/transactions")}
          />

          <Tile
            title="Expenses"
            value={formatCurrency(totals.expenses, region)}
            sub="Past 30 days"
            onClick={() => pushAppRoute("/app/transactions")}
          />

          <Tile
            title="Net"
            value={formatCurrency(totals.net, region)}
            sub="Past 30 days"
            onClick={() => pushAppRoute("/app/cashflow")}
          />

          <Tile
            title="Subscriptions"
            value={formatCurrency(totals.recurringTotal, region)}
            sub="Estimated recurring"
            onClick={() => pushAppRoute("/app/subscriptions")}
          />

          <Tile
            title="Budget Autopilot"
            value="Open"
            sub="Rules + coaching"
            onClick={() => pushAppRoute("/app/budget-autopilot")}
          />

          <Tile
            title="Weekly Orders"
            value="Open"
            sub="AI-suggested schedule"
            onClick={() => pushAppRoute("/app/weekly-orders")}
          />

          <Tile
            title="Portfolio"
            value="Open"
            sub="Manual tracker"
            onClick={() => pushAppRoute("/app/portfolio")}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => pushAppRoute("/app/budget-autopilot")}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] p-5 text-left shadow-2xl shadow-black/40 transition hover:border-white/20 hover:bg-[#101018]"
        >
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl transition group-hover:bg-white/10" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/75">Automate your budget</p>
              <p className="mt-2 text-2xl font-semibold text-white">Budget Autopilot</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">VISIT PAGE</p>
            </div>
            <span className="text-white/50">→</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => pushAppRoute("/app/subscriptions")}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] p-5 text-left shadow-2xl shadow-black/40 transition hover:border-white/20 hover:bg-[#101018]"
        >
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl transition group-hover:bg-white/10" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/75">Find recurring charges</p>
              <p className="mt-2 text-2xl font-semibold text-white">Subscription Hunter</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">VISIT PAGE</p>
            </div>
            <span className="text-white/50">→</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => pushAppRoute("/app/transactions")}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] p-5 text-left shadow-2xl shadow-black/40 transition hover:border-white/20 hover:bg-[#101018]"
        >
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1F0051]/20 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/75">Search transactions</p>
              <p className="mt-2 text-2xl font-semibold text-white">Open ledger</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">VISIT PAGE</p>
            </div>
            <span className="text-white/50">→</span>
          </div>
        </button>
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
        isOpen={tourOpen}
        steps={tourSteps}
        stepIndex={tourStep}
        onNext={() => setTourStep((s) => Math.min(s + 1, tourSteps.length - 1))}
        onBack={() => setTourStep((s) => Math.max(s - 1, 0))}
        onClose={onTourClose}
      />

      <LegalFooter />

      <AiAssistant region={region} accounts={accounts} transactions={transactions} lastUpdated={lastUpdated} />
    </div>
  );
};

export default Dashboard;
