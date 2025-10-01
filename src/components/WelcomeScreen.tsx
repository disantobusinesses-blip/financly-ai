import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { SparklesIcon, GaugeIcon, LoanIcon, ChartIcon } from "./icon/Icon";

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm text-left">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-primary">{icon}</div>
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    <p className="text-gray-300 text-sm">{children}</p>
  </div>
);

const WelcomeScreen: React.FC = () => {
  const { login, setIsLoginModalOpen, setIsSignupModalOpen } = useAuth();

  const handleDemoLogin = () => {
    // ✅ force demo mode
    localStorage.setItem("demoMode", "true");

    // ✅ login as demo user
    const ok = login("demo@financly.com", "demo123");
    if (!ok) {
      alert("Demo login failed. Check AuthContext demo user setup.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full bg-gray-900 text-white font-sans p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary/30 z-0"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-4000"></div>

      <div className="relative z-10 text-center p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <SparklesIcon className="h-6 w-6 text-primary" />
          <span className="text-gray-300 font-medium">Powered By Financly AI</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          Unlock Your Financial <span className="text-primary">Potential</span>.
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Go beyond simple budgeting. See your forecast, find hidden subscriptions, and take control of your money.
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mb-10">
          <button
            onClick={handleDemoLogin}
            className="px-6 py-3 bg-primary text-white rounded-lg shadow hover:bg-primary/80 transition"
          >
            Try Demo Account
          </button>
          <button
            onClick={() => setIsSignupModalOpen(true)}
            className="px-6 py-3 bg-secondary text-white rounded-lg shadow hover:bg-secondary/80 transition"
          >
            Sign Up
          </button>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-600 transition"
          >
            Login
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-white">
          <FeatureCard icon={<GaugeIcon />} title="Know Your Score">
            Get a clear view of your credit score and the factors that shape it.
          </FeatureCard>
          <FeatureCard icon={<LoanIcon />} title="See Your Power">
            AI shows you what you can responsibly borrow.
          </FeatureCard>
          <FeatureCard icon={<ChartIcon />} title="Track Your Spending">
            Find hidden savings and get personalized insights.
          </FeatureCard>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
