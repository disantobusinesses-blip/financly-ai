import React, { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [/*showSyncing*/, /*setShowSyncing*/] = useState(false);

  // Not logged in → show welcome first
  if (!user) return <WelcomeScreen />;

  // Logged in → header + dashboard
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main className="p-6">
        <Dashboard />   {/* ✅ no props here */}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </AuthProvider>
);

export default App;
