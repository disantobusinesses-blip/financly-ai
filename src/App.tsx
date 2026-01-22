import React, { useEffect, useMemo, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Portfolio from "./components/Portfolio";
import Analytics from "./components/Analytics";
import WelcomeScreen from "./components/WelcomeScreen";
import SandboxShowcase from "./components/SandboxShowcase";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
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

import { AppDataProvider, useAppData } from "./contexts/AppDataContext";

// Existing components (no new data fetching / no Fiskil changes)
import SpendingForecast from "./components/SpendingForecast";
import SubscriptionHunter from "./components/SubscriptionHunter";
import TransactionsList from "./components/TransactionsList";
import CashflowMini from "./components/CashflowMini";
import FinancialHealthCard from "./components/FinancialHealthCard";

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

const ComingSoon: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] p-6 shadow-2xl shadow-black/50">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1F0051]/25 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Preview</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          {subtitle ??
            "This feature is in development. The page shell is live so we can wire real data safely without changing bank connection flows."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-white/10 bg-white/5" aria-hidden="true" />
          ))}
        </div>

        <div className="mt-6 text-xs text-white/45">Educational previews only. No financial product recommendations.</div>
      </div>
    </section>
  );
};

const AppShellPages: React.FC<{ path: string }> = ({ path }) => {
  const { user } = useAuth();
  const { accounts, transactions, loading, error, lastUpdated } = useAppData();
  const region = user?.region ?? "AU";

  const Status = () => {
    if (!loading && !error) return null;
    return (
      <div className="mb-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white/70">
        {loading ? "Syncing bank data…" : error}
      </div>
    );
  };

  // Overview
  if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") {
    return <Dashboard />;
  }

  // Core pages (wired to real data)
  if (path === "/app/forecast") {
    return (
      <>
        <Status />
        <SpendingForecast accounts={accounts} transactions={transactions} region={region} />
        {lastUpdated ? (
          <p className="mt-4 text-xs text-white/60">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
        ) : null}
      </>
    );
  }

  if (path === "/app/subscriptions") {
    return (
      <>
        <Status />
        <SubscriptionHunter transactions={transactions} region={region} />
        {lastUpdated ? (
          <p className="mt-4 text-xs text-white/60">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
        ) : null}
      </>
    );
  }

  if (path === "/app/transactions") {
    return (
      <>
        <Status />
        <TransactionsList transactions={transactions} />
        {lastUpdated ? (
          <p className="mt-4 text-xs text-white/60">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
        ) : null}
      </>
    );
  }

  if (path === "/app/cashflow") {
    return (
      <>
        <Status />
        <CashflowMini transactions={transactions} region={region} />
        {lastUpdated ? (
          <p className="mt-4 text-xs text-white/60">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
        ) : null}
      </>
    );
  }

  if (path === "/app/reports") {
    return (
      <>
        <Status />
        <FinancialHealthCard transactions={transactions} region={region} />
        {lastUpdated ? (
          <p className="mt-4 text-xs text-white/60">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
        ) : null}
      </>
    );
  }

  if (path === "/app/profile") {
    return <ProfilePage />;
  }

  // ✅ Use the real Analytics component
  if (path === "/app/analytics") return <Analytics />;

  // ✅ Use the real Portfolio component
  if (path === "/app/portfolio") return <Portfolio />;

  // New feature routes (preview shells for now)
  if (path === "/app/net-worth")
    return <ComingSoon title="Net Worth" subtitle="Assets, liabilities, and net worth history (manual inputs + bank insights later)." />;
  if (path === "/app/markets") return <ComingSoon title="Markets & Watchlist" subtitle="Tracking only. No trade execution." />;
  if (path === "/app/dividends") return <ComingSoon title="Dividend Calendar" subtitle="Estimated dividend dates and income based on entered holdings." />;
  if (path === "/app/paper-trading") return <ComingSoon title="Paper Trading" subtitle="Hypothetical portfolios and simulations (education only)." />;

  if (path === "/app/goal-planner") return <ComingSoon title="Goal Planner" subtitle="User-driven goal scenarios and contribution planning." />;
  if (path === "/app/invest-vs-cash") return <ComingSoon title="Invest vs Cash" subtitle="Hypothetical comparison charts (user inputs drive outcomes)." />;
  if (path === "/app/etf-comparison") return <ComingSoon title="ETF Comparison" subtitle="Display-only: fees and historical stats. No recommendations." />;
  if (path === "/app/risk-profile") return <ComingSoon title="Risk Profile" subtitle="Education-only risk tolerance insights (no allocation advice)." />;
  if (path === "/app/dca-calculator") return <ComingSoon title="DCA Calculator" subtitle="Hypothetical dollar-cost averaging calculator (user inputs only)." />;

  if (path === "/app/bill-detection") return <ComingSoon title="Bill Detection" subtitle="Detect recurring bills and possible savings opportunities." />;
  if (path === "/app/risk-warnings") return <ComingSoon title="Risk Warnings" subtitle="Upcoming balance risk and anomaly warnings." />;

  if (path === "/app/health-score") return <ComingSoon title="Health Score" subtitle="Transparent financial health score breakdown." />;
  if (path === "/app/tax-center") return <ComingSoon title="Tax Center" subtitle="Exports and summaries to help with tax time." />;
  if (path === "/app/security") return <ComingSoon title="Security & Fraud" subtitle="Fraud/anomaly insights and security center." />;

  if (path === "/app/settings") return <ComingSoon title="Settings" subtitle="App settings, notifications, and preferences." />;

  return <Dashboard />;
};

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { path, navigate } = usePath();

  useEffect(() => {
    const handleScroll = () => {
      const offset = Math.min(0, window.scrollY * -0.15);
      document.documentElement.style.setProperty("--scroll-offset", `${offset}px`);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const backgroundLayers = (
    <>
      <div className="floating-particles" aria-hidden="true" />
      <div className="scroll-light" aria-hidden="true" />
    </>
  );

  const isAppShellRoute = useMemo(() => {
    return (
      path === "/dashboard" ||
      path === "/app" ||
      path === "/app/dashboard" ||
      path === "/app/profile" ||
      path === "/app/forecast" ||
      path === "/app/subscriptions" ||
      path === "/app/transactions" ||
      path === "/app/cashflow" ||
      path === "/app/reports" ||
      // New routes
      path === "/app/analytics" ||
      path === "/app/portfolio" ||
      path === "/app/net-worth" ||
      path === "/app/markets" ||
      path === "/app/dividends" ||
      path === "/app/paper-trading" ||
      path === "/app/goal-planner" ||
      path === "/app/invest-vs-cash" ||
      path === "/app/etf-comparison" ||
      path === "/app/risk-profile" ||
      path === "/app/dca-calculator" ||
      path === "/app/bill-detection" ||
      path === "/app/risk-warnings" ||
      path === "/app/health-score" ||
      path === "/app/tax-center" ||
      path === "/app/security" ||
      path === "/app/settings"
    );
  }, [path]);

  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItem>("overview");

  useEffect(() => {
    // Keep sidebar highlight aligned with current route
    if (path === "/app/analytics") setActiveSidebarItem("analytics");
    else if (path === "/app/forecast") setActiveSidebarItem("forecast");
    else if (path === "/app/transactions") setActiveSidebarItem("transactions");
    else if (path === "/app/subscriptions") setActiveSidebarItem("subscriptions");
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
    else if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") setActiveSidebarItem("overview");
    else setActiveSidebarItem("overview");
  }, [path]);

  const handleSidebarNavigate = (item: SidebarItem) => {
    setActiveSidebarItem(item);

    switch (item) {
      case "upgrade":
        navigate("/subscribe");
        return;

      case "overview":
        if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate("/app/dashboard");
        }
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
        navigate("/app/cashflow");
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

      default:
        navigate("/app/dashboard");
        return;
    }
  };

  // Public / auth routes
  if (path === "/signup") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <SignupPage />
      </div>
    );
  }

  if (path === "/onboarding") {
    if (!user && !loading) {
      navigate("/login");
      return null;
    }
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <OnboardingPage />
      </div>
    );
  }

  if (path === "/fiskil/callback") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <FiskilCallbackPage />
      </div>
    );
  }

  if (path === "/login") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <LoginPage onSuccess={() => navigate("/app/dashboard")} />
      </div>
    );
  }

  if (path === "/subscribe") {
    if (!user && !loading) {
      navigate("/onboarding");
      return null;
    }
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <SubscribePage />
      </div>
    );
  }

  if (path === "/auth/callback") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <AuthCallbackPage />
      </div>
    );
  }

  if (path === "/subscription/success") {
    if (!user && !loading) {
      navigate("/login");
      return null;
    }
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <SubscriptionSuccessPage onComplete={() => navigate("/app/dashboard")} />
      </div>
    );
  }

  if (path === "/what-we-do") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header activeView="what-we-do" onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <main className="px-4 pb-16 pt-24 md:px-8">
          <WhatWeDo />
        </main>
      </div>
    );
  }

  if (path === "/sandbox") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header activeView="sandbox" onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <main className="px-4 pb-16 pt-24 md:px-8">
          <SandboxShowcase />
        </main>
      </div>
    );
  }

  // App shell (authenticated)
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

    const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <div className="mx-auto flex w-full max-w-[1400px] gap-5 px-4 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-8">
          <Sidebar activeItem={activeSidebarItem} onNavigate={handleSidebarNavigate} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    );

    return (
      <AppDataProvider>
        <Shell>
          <AppShellPages path={path} />
        </Shell>
      </AppDataProvider>
    );
  }

  if (user && profile?.is_onboarded && !isAppShellRoute) {
    navigate("/app/dashboard");
    return null;
  }

  // Landing
  return (
    <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
      {backgroundLayers}
      <Header activeView="dashboard" onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
      <WelcomeScreen
        onGetStarted={() => navigate("/signup")}
        onLogin={() => navigate("/login")}
        onDashboard={user ? () => navigate("/app/dashboard") : undefined}
      />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <AppContent />
      <SpeedInsights />
    </ThemeProvider>
  </AuthProvider>
);

export default App;
