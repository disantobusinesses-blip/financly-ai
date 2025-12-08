import React, { useEffect, useState } from "react";
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
import BasiqCallbackPage from "./pages/BasiqCallback";

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
      setPath(next);
    }
  };
  return { path, navigate };
};

const AppContent: React.FC = () => {
  const { user, profile, session, loading } = useAuth();
  const { path, navigate } = usePath();
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefreshTransactions = async () => {
    if (!session?.access_token) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/refresh-transactions", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Unable to refresh transactions");
      }
      localStorage.removeItem("accountsCache");
      localStorage.removeItem("transactionsCache");
      navigate(window.location.pathname);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Unable to refresh transactions right now.");
    } finally {
      setRefreshing(false);
    }
  };

  if (path === "/signup") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
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
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <OnboardingPage />
      </div>
    );
  }

  if (path === "/login") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <LoginPage onSuccess={() => navigate("/dashboard")} />
      </div>
    );
  }

  if (path === "/subscribe") {
    if (!user && !loading) {
      navigate("/onboarding");
      return null;
    }
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <SubscribePage />
      </div>
    );
  }

  if (path === "/auth/callback") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <AuthCallbackPage />
      </div>
    );
  }

  if (path === "/basiq/callback") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <BasiqCallbackPage />
      </div>
    );
  }

  if (path === "/subscription/success") {
    if (!user && !loading) {
      navigate("/login");
      return null;
    }
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <SubscriptionSuccessPage onComplete={() => navigate("/app/dashboard")} />
      </div>
    );
  }

  if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") {
    if (!user && !loading) {
      navigate("/login");
      return null;
    }
    if (user && profile && !profile.is_onboarded) {
      navigate("/onboarding");
      return null;
    }
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <main className="px-4 pb-16 pt-6 md:px-8">
          {profile?.has_bank_connection && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={handleRefreshTransactions}
                disabled={refreshing}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/60 disabled:opacity-60"
              >
                {refreshing ? "Refreshing transactions..." : "Refresh transactions"}
              </button>
            </div>
          )}
          <Dashboard />
        </main>
      </div>
    );
  }

  if (path === "/what-we-do") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <Header activeView="what-we-do" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <main className="px-4 pb-16 pt-24 md:px-8">
          <WhatWeDo />
        </main>
      </div>
    );
  }

  if (path === "/sandbox") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <Header activeView="sandbox" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <main className="px-4 pb-16 pt-24 md:px-8">
          <SandboxShowcase />
        </main>
      </div>
    );
  }

  if (user && profile?.is_onboarded) {
    navigate("/app/dashboard");
    return null;
  }

  return (
    <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
      {backgroundLayers}
      <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
      <WelcomeScreen onGetStarted={() => navigate("/signup")} onLogin={() => navigate("/login")} />
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
