import React from "react";
import { useNavigate } from "react-router-dom";
import { initiateBankConnection } from "../services/BankingService";

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleDemoClick = () => {
    // Clear any existing Basiq userId so hook falls back to demo
    localStorage.removeItem("basiqUserId");
    navigate("/dashboard");
  };

  const handleConnectBank = async () => {
    try {
      // For sandbox you can default to demo@financly.com
      const { consentUrl, userId } = await initiateBankConnection("demo@financly.com");
      localStorage.setItem("basiqUserId", userId);
      window.location.href = consentUrl; // Redirect to Basiq sandbox login
    } catch (err) {
      console.error("❌ Failed to initiate bank connection:", err);
      alert("Unable to start bank connection right now.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-background text-text-primary">
      <h1 className="text-3xl font-bold">Welcome to Financly AI</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        Choose how you want to get started
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleDemoClick}
          className="px-6 py-3 bg-primary text-white rounded-lg"
        >
          Try Demo Account
        </button>

        <button
          onClick={handleConnectBank}
          className="px-6 py-3 bg-green-600 text-white rounded-lg"
        >
          Connect Bank (Sandbox)
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
