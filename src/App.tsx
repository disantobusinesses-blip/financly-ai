// src/App.tsx
import React, { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";
import OnboardingRestoreNotice from "./components/OnboardingRestoreNotice";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [/*showSyncing*/, /*setShowSyncing*/] = useState(false);

  if (!user) return <WelcomeScreen />;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main className="p-6">
        <OnboardingRestoreNotice />
        <Dashboard />
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <OnboardingProvider>
      <ThemeProvider>
        <AppContent />
        {/* ✅ keep modals mounted */}
        <LoginModal />
        <SignupModal />
      </ThemeProvider>
    </OnboardingProvider>
  </AuthProvider>
);

export default App;
