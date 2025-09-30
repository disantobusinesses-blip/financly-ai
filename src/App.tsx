import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [hasBasiqUser, setHasBasiqUser] = useState(false);

  useEffect(() => {
    const basiqId = localStorage.getItem("basiqUserId");
    setHasBasiqUser(!!basiqId);
  }, []);

  // Show Welcome screen if no user and no Basiq connection
  if (!user && !hasBasiqUser) {
    return <WelcomeScreen />;
  }

  // Otherwise → Dashboard
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
    </ThemeProvider>
  </AuthProvider>
);

export default App;
