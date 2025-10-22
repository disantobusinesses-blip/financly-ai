import React, { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";
import UpgradeModal from "./components/UpgradeModal";
import WhatWeDo from "./components/WhatWeDo";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"dashboard" | "what-we-do">("dashboard");

  if (!user) {
    if (activeView === "what-we-do") {
      return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
          <Header activeView={activeView} onNavigate={setActiveView} />
          <main className="px-4 pb-16 pt-24 md:px-8">
            <WhatWeDo />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header activeView={activeView} onNavigate={setActiveView} />
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Header activeView={activeView} onNavigate={setActiveView} />
      <main className={`px-4 pb-16 pt-6 md:px-8 ${activeView === "what-we-do" ? "pt-24" : ""}`}>
        {activeView === "what-we-do" ? <WhatWeDo /> : <Dashboard />}
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
    </ThemeProvider>
  </AuthProvider>
);

export default App;
