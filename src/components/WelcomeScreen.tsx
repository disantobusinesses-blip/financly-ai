import React from "react";
import { initiateBankConnection } from "../services/BankingService";
import { useAuth } from "../contexts/AuthContext";

const WelcomeScreen: React.FC = () => {
  const { login, signup } = useAuth();

  const handleDemoClick = () => {
    localStorage.removeItem("basiqUserId"); // ensure demo mode
    window.location.href = "/dashboard";
  };

  const handleConnectBank = async () => {
    try {
      const { consentUrl, userId } = await initiateBankConnection("demo@financly.com");
      localStorage.setItem("basiqUserId", userId);
      window.location.href = consentUrl;
    } catch (err) {
      console.error("❌ Failed to start bank connection:", err);
      alert("Unable to connect bank right now.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-text-primary">
      <h1 className="text-4xl font-bold mb-6">Welcome to Financly AI</h1>
      <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">
        Smarter budgeting with AI. Connect your bank or try our demo.
      </p>

      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={handleDemoClick}
          className="px-6 py-3 bg-primary text-white rounded-lg w-full"
        >
          Try Demo Account
        </button>

        <button
          onClick={handleConnectBank}
          className="px-6 py-3 bg-green-600 text-white rounded-lg w-full"
        >
          Connect Bank (Sandbox)
        </button>

        <button
          onClick={login}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg w-full"
        >
          Login
        </button>

        <button
          onClick={signup}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg w-full"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
