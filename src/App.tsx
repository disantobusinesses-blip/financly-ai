import React from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-text-primary">
          <Header />
          <main className="p-6">
            <Dashboard />
          </main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
