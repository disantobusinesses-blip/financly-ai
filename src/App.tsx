import React, { useEffect, useMemo, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
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
import Sidebar from "./components/Sidebar";

import { AppDataProvider, useAppData } from "./contexts/AppDataContext";

// Reuse existing components for dedicated pages (no new data fetching / no Fiskil changes)
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

type SidebarItem = "overview" | "forecast" | "subscriptions" | "transactions" | "budget" | "reports" | "upgrade";

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

  if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") {
    return <Dashboard />;
  }

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
      path === "/app/reports"
    );
  }, [path]);

  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItem>("overview");

  useEffect(() => {
    if (path === "/app/forecast") setActiveSidebarItem("forecast");
    else if (path === "/app/subscriptions") setActiveSidebarItem("subscriptions");
    else if (path === "/app/transactions") setActiveSidebarItem("transactions");
    else if (path === "/app/cashflow") setActiveSidebarItem("budget");
    else if (path === "/app/reports") setActiveSidebarItem("reports");
    else setActiveSidebarItem("overview");
  }, [path]);

  const handleSidebarNavigate = (item: SidebarItem) => {
    setActiveSidebarItem(item);

    if (item === "upgrade") return navigate("/subscribe");
    if (item === "forecast") return navigate("/app/forecast");
    if (item === "subscriptions") return navigate("/app/subscriptions");
    if (item === "transactions") return navigate("/app/transactions");
    if (item === "budget") return navigate("/app/cashflow");
    if (item === "reports") return navigate("/app/reports");

    if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    return navigate("/app/dashboard");
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
