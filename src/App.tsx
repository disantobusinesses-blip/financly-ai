import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [forceDemo, setForceDemo] = useState(false);

  useEffect(() => {
    // Check if demo mode flag is set
    const demoFlag = localStorage.getItem("demoMode");
    setForceDemo(demoFlag === "true");
  }, []);

  // If no login, no basiq connection, and no demo → show WelcomeScreen
  if (!user && !forceDemo && !localStorage.getItem("basiqUserId")) {
    return <WelcomeScreen />;
  }

  // Otherwise → show Dashboard
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main className="p-6">
        <Dashboard isDemo={forceDemo} />
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
