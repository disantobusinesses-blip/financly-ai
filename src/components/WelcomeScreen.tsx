import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon, GaugeIcon, LoanIcon, ChartIcon } from './icon/Icon';
import { initiateBankConnection } from '../services/BankingService';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm text-left transition-transform transform hover:scale-105 hover:bg-white/10 shadow-lg hover:shadow-primary/30">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-primary">{icon}</div>
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    <p className="text-gray-300 text-sm">{children}</p>
  </div>
);

const WelcomeScreen: React.FC = () => {
  const { setIsLoginModalOpen, setIsSignupModalOpen } = useAuth();

  const handleDemoLogin = () => {
    localStorage.removeItem("basiqUserId");
    window.location.reload();
  };

  const handleConnectBank = async () => {
    try {
      const { consentUrl, userId } = await initiateBankConnection("demo@financly.com");
      localStorage.setItem("basiqUserId", userId);
      window.location.href = consentUrl;
    } catch (err) {
      console.error("❌ Failed to connect bank:", err);
      alert("Unable to connect bank right now.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full bg-gray-900 text-white font-sans p-4 relative overflow-hidden">
      {/* Background gradient + orbs */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary/30 z-0"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-4000"></div>

      <div className="relative z-10 text-center p-8 max-w-5xl mx-auto">
        {/* Logo + tagline */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <SparklesIcon className="h-7 w-7 text-primary animate-pulse" />
          <span className="text-gray-300 font-medium tracking-wide">Powered By Financly Ai</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight drop-shadow-md">
          Unlock Your Financial <span className="text-primary">Potential</span>.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Go beyond simple budgeting. Forecast your future, find hidden subscriptions, and take control of your money — with AI precision.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleDemoLogin}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium transition-transform transform hover:scale-105 hover:shadow-lg hover:shadow-primary/40"
          >
            Try Demo Account
          </button>
          <button
            onClick={handleConnectBank}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium transition-transform transform hover:scale-105 hover:shadow-lg hover:shadow-green-400/40"
          >
            Connect Bank (Sandbox)
          </button>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium transition-transform transform hover:scale-105 hover:shadow-md"
          >
            Login
          </button>
          <button
            onClick={() => setIsSignupModalOpen(true)}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium transition-transform transform hover:scale-105 hover:shadow-md"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
