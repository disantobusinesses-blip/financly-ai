// src/App.tsx
import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";
import UpgradeModal from "./components/UpgradeModal";
import WhatWeDoPage from "./pages/WhatWeDo";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"dashboard" | "whatWeDo">(
    "dashboard"
  );

  useEffect(() => {
    if (user) {
      setActiveView("dashboard");
    }
  }, [user]);

  if (!user) return <WelcomeScreen />;

  return (
    <div className="min-h-screen bg-slate-100 text-text-primary">
      <Header activeView={activeView} onNavigate={setActiveView} />
      <main className="p-6">
        {activeView === "dashboard" ? (
          <Dashboard />
        ) : (
          <WhatWeDoPage onNavigateHome={() => setActiveView("dashboard")} />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <AppContent />
      {/* ✅ keep modals mounted */}
      <LoginModal />
      <SignupModal />
      <UpgradeModal />
    </ThemeProvider>
  </AuthProvider>
);

export default App;
