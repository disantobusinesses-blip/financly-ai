import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { initiateBankConnection } from "../services/BankingService";

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleConnectBankClick = async () => {
    if (!user?.email) return;
    try {
      const { consentUrl, userId } = await initiateBankConnection(user.email);
      localStorage.setItem("basiqUserId", userId);
      window.location.href = consentUrl; // Basiq consent
    } catch (err) {
      console.error("Failed to start bank connection:", err);
      alert("Unable to connect bank right now.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("basiqUserId");
      window.location.href = "/"; // back to welcome screen
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="bg-white dark:bg-neutral-900 shadow px-4 py-3 flex items-center justify-between">
      <h1
        className="text-xl font-bold text-primary cursor-pointer"
        onClick={() => (window.location.href = "/")}
      >
        Financly AI
      </h1>
      <nav className="flex items-center gap-4">
        {user ? (
          <>
            <button
              onClick={handleConnectBankClick}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Connect Bank
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => (window.location.href = "/login")}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Login
            </button>
            <button
              onClick={() => (window.location.href = "/signup")}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded"
            >
              Sign Up
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
