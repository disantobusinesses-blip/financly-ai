// src/App.tsx
import React, { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [/*showSyncing*/, /*setShowSyncing*/] = useState(false);

  if (!user) return <WelcomeScreen />;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main className="p-6">
        <Dashboard />
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
    </ThemeProvider>
  </AuthProvider>
);

export default App;
