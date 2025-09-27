import React, { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const App: React.FC = () => {
  const [showSyncing, setShowSyncing] = useState(false);

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-text-primary">
          {/* ✅ Header no longer receives an undeclared prop */}
          <Header />
          <main className="p-6">
            <Dashboard />
          </main>

          {showSyncing && (
            <div className="fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded shadow">
              Syncing data...
            </div>
          )}
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
