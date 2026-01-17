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
import Sidebar, { SidebarItem } from "./components/Sidebar";

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

const scrollToTourId = (tourId: string) => {
  const el = document.querySelector(`[data-tour-id="${tourId}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }
  return false;
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

  const isAppRoute = useMemo(() => {
    return path === "/dashboard" || path === "/app" || path === "/app/dashboard" || path === "/app/profile";
  }, [path]);

  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItem>("overview");

  useEffect(() => {
    // set a sensible default on route changes
    if (path === "/app/profile") {
      setActiveSidebarItem("overview");
      return;
    }
    if (path === "/dashboard" || path === "/app" || path === "/app/dashboard") {
      setActiveSidebarItem("overview");
    }
  }, [path]);

  const handleSidebarNavigate = (item: SidebarItem) => {
    setActiveSidebarItem(item);

    // Upgrade = route
    if (item === "upgrade") {
      navigate("/subscribe");
      return;
    }

    // Profile is handled by top buttons inside Dashboard; sidebar is dashboard-only nav for now
    if (path === "/app/profile") {
      navigate("/app/dashboard");
      // let Dashboard mount then scroll
      setTimeout(() => {
        if (item === "overview") window.scrollTo({ top: 0, behavior: "smooth" });
        if (item === "transactions") scrollToTourId("transactions");
        if (item === "budget") scrollToTourId("cashflow");
        if (item === "reports") scrollToTourId("financial-health");
      }, 150);
      return;
    }

    // Scroll-based navigation on dashboard
    if (item === "overview") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (item === "transactions") {
      if (!scrollToTourId("transactions")) window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (item === "budget") {
      // closest existing section in your dashboard
      if (!scrollToTourId("cashflow")) window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (item === "reports") {
      if (!scrollToTourId("financial-health")) window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Public routes
  if (path === "/signup") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header
          activeView="dashboard"
          onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
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
          onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
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
          onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
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
          onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
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

  // ✅ App shell routes (Sidebar + content)
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
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}

        <div className="mx-auto flex w-full max-w-[1400px] gap-5 px-4 pb-16 pt-6 md:px-8">
          <Sidebar activeItem={activeSidebarItem} onNavigate={handleSidebarNavigate} />
          <main className="min-w-0 flex-1">
            <Dashboard />
          </main>
        </div>
      </div>
    );
  }

  if (path === "/app/profile") {
    if (!user && !loading) {
      navigate("/login");
      return null;
    }
    if (user && profile && !profile.is_onboarded) {
      navigate("/onboarding");
      return null;
    }

    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}

        <div className="mx-auto flex w-full max-w-[1400px] gap-5 px-4 pb-16 pt-6 md:px-8">
          <Sidebar activeItem={activeSidebarItem} onNavigate={handleSidebarNavigate} />
          <main className="min-w-0 flex-1">
            <ProfilePage />
          </main>
        </div>
      </div>
    );
  }

  if (path === "/what-we-do") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
        {backgroundLayers}
        <Header
          activeView="what-we-do"
          onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
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
          onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
        />
        <main className="px-4 pb-16 pt-24 md:px-8">
          <SandboxShowcase />
        </main>
      </div>
    );
  }

  if (user && profile?.is_onboarded && !isAppRoute) {
    navigate("/app/dashboard");
    return null;
  }

  return (
    <div className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
      {backgroundLayers}
      <Header
        activeView="dashboard"
        onNavigate={(view) => (view === "dashboard" ? navigate("/") : navigate(`/${view}`))}
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
