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

  if (path === "/onboarding") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <OnboardingPage onComplete={() => navigate("/subscribe")} />
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

  if (path === "/subscription/success") {
    if (!user && !loading) {
      navigate("/onboarding");
      return null;
    }
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <SubscriptionSuccessPage onComplete={() => navigate("/dashboard")} />
      </div>
    );
  }

  if (path === "/dashboard" || path === "/app") {
    if (!user && !loading) {
      navigate("/onboarding");
      return null;
    }
    if (user && profile?.subscription_status !== "active") {
      navigate("/subscribe");
      return null;
    }
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
        {backgroundLayers}
        <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
        <main className="px-4 pb-16 pt-6 md:px-8">
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

  return (
    <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
      {backgroundLayers}
      <Header activeView="dashboard" onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))} />
      <WelcomeScreen onGetStarted={() => navigate("/onboarding")} onLogin={() => navigate("/login")} />
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
