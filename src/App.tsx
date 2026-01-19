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
      // Trigger listeners consistently across the app
      window.dispatchEvent(new PopStateEvent("popstate"));
      setPath(next);
    }
  };

  return { path, navigate };
};

type SidebarItem = "overview" | "forecast" | "subscriptions" | "transactions" | "budget" | "reports" | "upgrade";

const scrollToTourId = (tourId: string) => {
  const el = document.querySelector(`[data-tour-id="${tourId}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }
  return false;
};

const AppContent: React.FC = () => {
  const { user, profile, loading, session } = useAuth();
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

  // App shell routes (sidebar + main content)
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
    // Keep sidebar state aligned with routes
    if (path === "/app/forecast") setActiveSidebarItem("forecast");
    else if (path === "/app/subscriptions") setActiveSidebarItem("subscriptions");
    else if (path === "/app/transactions") setActiveSidebarItem("transactions");
    else if (path === "/app/cashflow") setActiveSidebarItem("budget");
    else if (path === "/app/reports") setActiveSidebarItem("reports");
    else setActiveSidebarItem("overview");
  }, [path]);

  const handleSidebarNavigate = (item: SidebarItem) => {
    setActiveSidebarItem(item);

    if (item === "upgrade") {
      navigate("/subscribe");
      return;
    }

    // Dedicated pages (Figma-like navigation)
    if (item === "forecast") {
      navigate("/app/forecast");
      return;
    }
    if (item === "subscriptions") {
      navigate("/app/subscriptions");
      return;
    }
    if (item === "transactions") {
      navigate("/app/transactions");
      return;
    }
    if (item === "budget") {
      navigate("/app/cashflow");
      return;
    }
    if (item === "reports") {
      navigate("/app/reports");
      return;
    }

    // Overview = dashboard
    if (item === "overview") {
      // If already on dashboard, scroll to top; otherwise route there.
      if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/app/dashboard");
      }
      return;
    }
  };

  // --- Public / auth routes ---
  if (path === "/signup") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header
          activeView="dashboard"
          onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
        />
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
        <Header
          activeView="dashboard"
          onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
        />
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
        <Header
          activeView="dashboard"
          onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
        />
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
        <Header
          activeView="dashboard"
          onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
        />
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
        <Header
          activeView="what-we-do"
          onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
        />
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
        <Header
          activeView="sandbox"
          onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
        />
        <main className="px-4 pb-16 pt-24 md:px-8">
          <SandboxShowcase />
        </main>
      </div>
    );
  }

  // --- App shell (authenticated) ---
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

    // Avoid repeating and keep this consistent
    const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        {/* Use safe top padding so iPhone doesn't look "cut off" */}
        <div className="mx-auto flex w-full max-w-[1400px] gap-5 px-4 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-8">
          <Sidebar activeItem={activeSidebarItem} onNavigate={handleSidebarNavigate} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    );

    // Dashboard
    if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") {
      return (
        <Shell>
          <Dashboard />
        </Shell>
      );
    }

    // Dedicated pages (Figma-style)
    if (path === "/app/forecast") {
      return (
        <Shell>
          {/* You likely want full-width hero here later; this is safe reuse now */}
          <SpendingForecast
            // These props come from Dashboard's data hook normally.
            // We cannot fetch Fiskil here without changing logic, so for now route stays in-shell
            // and you should navigate from Dashboard where data exists.
            // We'll make dedicated pages properly after we centralize data in a provider.
            accounts={[]}
            transactions={[]}
            region={user?.region ?? "AU"}
          />
          <p className="mt-4 text-xs text-white/60">
            Forecast page shell is wired. Next step: share Fiskil data via a context so this page can render real data
            without duplicating fetch logic.
          </p>
        </Shell>
      );
    }

    if (path === "/app/subscriptions") {
      return (
        <Shell>
          <SubscriptionHunter transactions={[]} region={user?.region ?? "AU"} />
          <p className="mt-4 text-xs text-white/60">
            Subscriptions page shell is wired. Next step: share transactions via a context so this page uses real data.
          </p>
        </Shell>
      );
    }

    if (path === "/app/transactions") {
      return (
        <Shell>
          <TransactionsList transactions={[]} />
          <p className="mt-4 text-xs text-white/60">
            Transactions page shell is wired. Next step: share transactions via a context so this page uses real data.
          </p>
        </Shell>
      );
    }

    if (path === "/app/cashflow") {
      return (
        <Shell>
          <CashflowMini transactions={[]} region={user?.region ?? "AU"} />
          <p className="mt-4 text-xs text-white/60">
            Cashflow page shell is wired. Next step: share transactions via a context so this page uses real data.
          </p>
        </Shell>
      );
    }

    if (path === "/app/reports") {
      return (
        <Shell>
          <FinancialHealthCard transactions={[]} region={user?.region ?? "AU"} />
          <p className="mt-4 text-xs text-white/60">
            Reports page shell is wired. Next step: share transactions via a context so this page uses real data.
          </p>
        </Shell>
      );
    }

    if (path === "/app/profile") {
      return (
        <Shell>
          <ProfilePage />
        </Shell>
      );
    }
  }

  // If user is onboarded and hits any non-shell route, bounce them into the app
  if (user && profile?.is_onboarded && !isAppShellRoute) {
    navigate("/app/dashboard");
    return null;
  }

  // Landing
  return (
    <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
      {backgroundLayers}
      <Header
        activeView="dashboard"
        onNavigate={(view: string) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
      />
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
