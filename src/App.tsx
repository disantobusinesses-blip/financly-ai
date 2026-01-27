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
    <p className="mt-2 max-w-2xl text-sm text-white/60">
      {subtitle ?? "This feature is in development."}
    </p>
  </section>
);

/* ---------------- APP SHELL ROUTES ---------------- */

const AppShellPages: React.FC<{ path: string }> = ({ path }) => {
  const { user } = useAuth();
  const { accounts, transactions, loading, error, lastUpdated } = useAppData();
  const region = user?.region ?? "AU";

  const Status = () =>
    loading || error ? (
      <div className="mb-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white/70">
        {loading ? "Syncing bank data…" : error}
      </div>
    ) : null;

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

  return <Dashboard />;
};

/* ---------------- APP CONTENT ---------------- */

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { path, navigate } = usePath();

  const isAppShellRoute = useMemo(
    () =>
      path.startsWith("/app") ||
      path === "/dashboard",
    [path]
  );

  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItem>("overview");

  useEffect(() => {
    if (path === "/app/weekly-orders") setActiveSidebarItem("weeklyOrders");
    else if (path === "/app/budget-autopilot") setActiveSidebarItem("budget");
    else if (path === "/app/forecast") setActiveSidebarItem("forecast");
    else if (path === "/app/subscriptions") setActiveSidebarItem("subscriptions");
    else if (path === "/app/transactions") setActiveSidebarItem("transactions");
    else if (path === "/app/cashflow") setActiveSidebarItem("budget");
    else if (path === "/app/reports") setActiveSidebarItem("reports");
    else setActiveSidebarItem("overview");
  }, [path]);

  const handleSidebarNavigate = (item: SidebarItem) => {
    setActiveSidebarItem(item);

    switch (item) {
      case "weeklyOrders":
        navigate("/app/weekly-orders");
        return;
      case "budget":
        navigate("/app/budget-autopilot");
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
      <Header activeView="dashboard" onNavigate={() => navigate("/")} />
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
