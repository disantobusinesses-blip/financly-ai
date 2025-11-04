import React, { useEffect, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import SandboxShowcase from "./components/SandboxShowcase";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";
import UpgradeModal from "./components/UpgradeModal";
import WhatWeDo from "./components/WhatWeDo";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"dashboard" | "what-we-do" | "sandbox">("dashboard");
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

  if (!user) {
    if (activeView === "sandbox") {
      return (
        <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
          {backgroundLayers}
          <Header activeView={activeView} onNavigate={setActiveView} />
          <main className="px-4 pb-16 pt-24 md:px-8">
            <SandboxShowcase />
          </main>
        </div>
      );
    }
    if (activeView === "what-we-do") {
      return (
        <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
          {backgroundLayers}
          <Header activeView={activeView} onNavigate={setActiveView} />
          <main className="px-4 pb-16 pt-24 md:px-8">
            <WhatWeDo />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <Header activeView={activeView} onNavigate={setActiveView} />
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      {backgroundLayers}
      <Header activeView={activeView} onNavigate={setActiveView} />
      <main
        className={`px-4 pb-16 pt-6 md:px-8 ${
          activeView === "what-we-do" || activeView === "sandbox" ? "pt-24" : ""
        }`}
      >
        {activeView === "what-we-do" ? (
          <WhatWeDo />
        ) : activeView === "sandbox" ? (
          <SandboxShowcase />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <AppContent />
      <LoginModal />
      <SignupModal />
      <UpgradeModal />
      <SpeedInsights />
    </ThemeProvider>
  </AuthProvider>
);

export default App;
