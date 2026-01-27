import React, { useEffect, useMemo, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Portfolio from "./components/Portfolio";
import Analytics from "./components/Analytics";
import WelcomeScreen from "./components/WelcomeScreen";
import SandboxShowcase from "./components/SandboxShowcase";
import BudgetAutopilot from "./components/BudgetAutopilot";
import WeeklyOrdersPage from "./components/WeeklyOrdersPage";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppDataProvider, useAppData } from "./contexts/AppDataContext";

import WhatWeDo from "./components/WhatWeDo";
import OnboardingPage from "./pages/Onboarding";
import SubscribePage from "./pages/Subscribe";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccess";
import LoginPage from "./pages/Login";
import AuthCallbackPage from "./pages/AuthCallback";
import SignupPage from "./pages/Signup";
import FiskilCallbackPage from "./pages/FiskilCallback";
import ProfilePage from "./pages/Profile";

import Sidebar, { type SidebarItem } from "./components/Sidebar";

// Existing components (no Fiskil changes)
import SpendingForecast from "./components/SpendingForecast";
import SubscriptionHunter from "./components/SubscriptionHunter";
import TransactionsList from "./components/TransactionsList";
import CashflowMini from "./components/CashflowMini";
import FinancialHealthCard from "./components/FinancialHealthCard";

/* ---------------- PATH HOOK ---------------- */

const usePath = () => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const navigate = (next: string) => {
    if (next !== window.location.pathname) {
      window.history.pushState({}, "", next);
      window.dispatchEvent(new PopStateEvent("popstate"));
      setPath(next);
    }
  };

  return { path, navigate };
};

/* ---------------- COMING SOON ---------------- */

const ComingSoon: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] p-6 shadow-2xl shadow-black/50">
    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Preview</p>
    <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
    <p className="mt-2 max-w-2xl text-sm text-white/60">{subtitle ?? "This feature is in development."}</p>
  </section>
);

/* ---------------- APP SHELL ROUTES ---------------- */

const AppShellPages: React.FC<{ path: string }> = ({ path }) => {
  const { user } = useAuth();
  const { accounts, transactions, loading, error, lastUpdated } = useAppData();
  const region = user?.region ?? "AU";

  const Status = () => {
    if (!loading && !error) return null;
    const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleString() : null;

    return (
      <div className="mb-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white/70">
        <div>{loading ? "Syncing bank data…" : error}</div>
        {lastUpdatedLabel ? <div className="mt-1 text-white/50">Last updated: {lastUpdatedLabel}</div> : null}
      </div>
    );
  };

  if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") return <Dashboard />;

  if (path === "/app/weekly-orders") return <WeeklyOrdersPage />;

  if (path === "/app/budget-autopilot") {
    return (
      <>
        <Status />
        <BudgetAutopilot transactions={transactions} region={region} />
      </>
    );
  }

  if (path === "/app/forecast")
    return (
      <>
        <Status />
        <SpendingForecast accounts={accounts} transactions={transactions} region={region} />
      </>
    );

  if (path === "/app/subscriptions")
    return (
      <>
        <Status />
        <SubscriptionHunter transactions={transactions} region={region} />
      </>
    );

  if (path === "/app/transactions")
    return (
      <>
        <Status />
        <TransactionsList transactions={transactions} />
      </>
    );

  if (path === "/app/cashflow")
    return (
      <>
        <Status />
        <CashflowMini transactions={transactions} region={region} />
      </>
    );

  if (path === "/app/reports")
    return (
      <>
        <Status />
        <FinancialHealthCard transactions={transactions} region={region} />
      </>
    );

  if (path === "/app/analytics") return <Analytics />;
  if (path === "/app/portfolio") return <Portfolio />;
  if (path === "/app/profile") return <ProfilePage />;

  if (path.startsWith("/app/")) {
    return (
      <>
        <Status />
        <ComingSoon title="Coming soon" subtitle="This page is in development." />
      </>
    );
  }

  return <Dashboard />;
};

/* ---------------- APP CONTENT ---------------- */

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { path, navigate } = usePath();

  const handleHeaderNavigate = (view: "dashboard" | "what-we-do" | "sandbox") => {
    if (view === "dashboard") navigate("/");
    else if (view === "what-we-do") navigate("/what-we-do");
    else navigate("/sandbox");
  };

  if (path === "/what-we-do") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="what-we-do" onNavigate={handleHeaderNavigate} />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <WhatWeDo />
        </div>
      </div>
    );
  }

  if (path === "/sandbox") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="sandbox" onNavigate={handleHeaderNavigate} />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <SandboxShowcase />
        </div>
      </div>
    );
  }

  if (path === "/login") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="dashboard" onNavigate={handleHeaderNavigate} />
        <LoginPage onSuccess={() => navigate("/app/dashboard")} />
      </div>
    );
  }

  if (path === "/signup") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="dashboard" onNavigate={handleHeaderNavigate} />
        <SignupPage />
      </div>
    );
  }

  if (path === "/onboarding") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="dashboard" onNavigate={handleHeaderNavigate} />
        <OnboardingPage onComplete={() => navigate("/app/dashboard")} />
      </div>
    );
  }

  if (path === "/subscribe") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="dashboard" onNavigate={handleHeaderNavigate} />
        <SubscribePage />
      </div>
    );
  }

  if (path === "/subscription-success") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="dashboard" onNavigate={handleHeaderNavigate} />
        <SubscriptionSuccessPage onComplete={() => navigate("/subscribe")} />
      </div>
    );
  }

  if (path === "/auth/callback") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="dashboard" onNavigate={handleHeaderNavigate} />
        <AuthCallbackPage />
      </div>
    );
  }

  if (path === "/fiskil/callback") {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <Header activeView="dashboard" onNavigate={handleHeaderNavigate} />
        <FiskilCallbackPage />
      </div>
    );
  }

  const isAppShellRoute = useMemo(() => path.startsWith("/app") || path === "/dashboard", [path]);

  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItem>("overview");

  useEffect(() => {
    if (path === "/app/weekly-orders") setActiveSidebarItem("weeklyOrders");
    else if (path === "/app/analytics") setActiveSidebarItem("analytics");
    else if (path === "/app/transactions") setActiveSidebarItem("transactions");
    else if (path === "/app/subscriptions") setActiveSidebarItem("subscriptions");
    else if (path === "/app/forecast") setActiveSidebarItem("forecast");
    else if (path === "/app/budget-autopilot") setActiveSidebarItem("budget");
    else if (path === "/app/cashflow") setActiveSidebarItem("budget");
    else if (path === "/app/reports") setActiveSidebarItem("reports");
    else if (path === "/app/portfolio") setActiveSidebarItem("portfolio");
    else if (path === "/app/net-worth") setActiveSidebarItem("netWorth");
    else if (path === "/app/markets") setActiveSidebarItem("markets");
    else if (path === "/app/dividends") setActiveSidebarItem("dividends");
    else if (path === "/app/paper-trading") setActiveSidebarItem("paperTrading");
    else if (path === "/app/goal-planner") setActiveSidebarItem("goalPlanner");
    else if (path === "/app/invest-vs-cash") setActiveSidebarItem("investVsCash");
    else if (path === "/app/etf-comparison") setActiveSidebarItem("etfComparison");
    else if (path === "/app/risk-profile") setActiveSidebarItem("riskProfile");
    else if (path === "/app/dca-calculator") setActiveSidebarItem("dcaCalculator");
    else if (path === "/app/bill-detection") setActiveSidebarItem("billDetection");
    else if (path === "/app/risk-warnings") setActiveSidebarItem("riskWarnings");
    else if (path === "/app/health-score") setActiveSidebarItem("healthScore");
    else if (path === "/app/tax-center") setActiveSidebarItem("taxCenter");
    else if (path === "/app/security") setActiveSidebarItem("security");
    else if (path === "/app/settings") setActiveSidebarItem("settings");
    else setActiveSidebarItem("overview");
  }, [path]);

  const handleSidebarNavigate = (item: SidebarItem) => {
    setActiveSidebarItem(item);

    switch (item) {
      case "overview":
        navigate("/app/dashboard");
        return;
      case "weeklyOrders":
        navigate("/app/weekly-orders");
        return;
      case "analytics":
        navigate("/app/analytics");
        return;
      case "forecast":
        navigate("/app/forecast");
        return;
      case "transactions":
        navigate("/app/transactions");
        return;
      case "subscriptions":
        navigate("/app/subscriptions");
        return;
      case "budget":
        navigate("/app/budget-autopilot");
        return;
      case "reports":
        navigate("/app/reports");
        return;
      case "portfolio":
        navigate("/app/portfolio");
        return;
      case "netWorth":
        navigate("/app/net-worth");
        return;
      case "markets":
        navigate("/app/markets");
        return;
      case "dividends":
        navigate("/app/dividends");
        return;
      case "paperTrading":
        navigate("/app/paper-trading");
        return;
      case "goalPlanner":
        navigate("/app/goal-planner");
        return;
      case "investVsCash":
        navigate("/app/invest-vs-cash");
        return;
      case "etfComparison":
        navigate("/app/etf-comparison");
        return;
      case "riskProfile":
        navigate("/app/risk-profile");
        return;
      case "dcaCalculator":
        navigate("/app/dca-calculator");
        return;
      case "billDetection":
        navigate("/app/bill-detection");
        return;
      case "riskWarnings":
        navigate("/app/risk-warnings");
        return;
      case "healthScore":
        navigate("/app/health-score");
        return;
      case "taxCenter":
        navigate("/app/tax-center");
        return;
      case "security":
        navigate("/app/security");
        return;
      case "settings":
        navigate("/app/settings");
        return;
      case "upgrade":
        navigate("/subscribe");
        return;
      default:
        navigate("/app/dashboard");
        return;
    }
  };

  const requireAuth = () => {
    if (!user && !loading) {
      navigate("/login");
      return true;
    }
    if (user && profile && !profile.is_onboarded) {
      navigate("/onboarding");
      return true;
    }
    return false;
  };

  if (isAppShellRoute) {
    if (requireAuth()) return null;

    return (
      <AppDataProvider>
        <div className="min-h-screen bg-[#050507] text-white">
          <div className="mx-auto flex max-w-[1400px] gap-5 px-4 py-6">
            <Sidebar activeItem={activeSidebarItem} onNavigate={handleSidebarNavigate} />
            <main className="flex-1">
              <AppShellPages path={path} />
            </main>
          </div>
        </div>
      </AppDataProvider>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <Header activeView="dashboard" onNavigate={handleHeaderNavigate} />
      <WelcomeScreen
        onGetStarted={() => navigate("/signup")}
        onLogin={() => navigate("/login")}
        onDashboard={user ? () => navigate("/app/dashboard") : undefined}
      />
    </div>
  );
};

/* ---------------- ROOT ---------------- */

const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <AppContent />
      <SpeedInsights />
    </ThemeProvider>
  </AuthProvider>
);

export default App;
