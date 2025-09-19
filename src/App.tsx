import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import WelcomeScreen from "./components/WelcomeScreen";
import UpgradeModal from "./components/UpgradeModal";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";
import { ThemeProvider } from "./contexts/ThemeContext";
import SyncingOverlay from "./components/SyncingOverlay";
import BasiqCallbackHandler from "./components/BasiqCallbackHandler";
import Subscriptions from "./pages/Subscriptions";

const AppContent: React.FC = () => {
  const { user, isLoginModalOpen, isSignupModalOpen } = useAuth();
  const [showSyncing, setShowSyncing] = useState(false);

  // track which page is active
  const [activePage, setActivePage] = useState<"dashboard" | "subscriptions">(
    "dashboard"
  );

  if (!user) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex h-full bg-background font-sans">
      {/* Sidebar */}
      <Sidebar setActivePage={setActivePage} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setShowSyncing={setShowSyncing} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "subscriptions" && <Subscriptions />}
        </main>
      </div>

      {/* Modals and overlays */}
      {isLoginModalOpen && <LoginModal />}
      {isSignupModalOpen && <SignupModal />}
      <UpgradeModal />
      {showSyncing && <SyncingOverlay />}
    </div>
  );
};

// This handles special Basiq redirect callback
const AppRouter: React.FC = () => {
  const isCallbackRoute = new URLSearchParams(window.location.search).has(
    "basiq_callback"
  );

  if (isCallbackRoute) {
    return <BasiqCallbackHandler />;
  }

  return <AppContent />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
