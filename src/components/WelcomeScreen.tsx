import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { SparklesIcon, GaugeIcon, LoanIcon, ChartIcon } from "./icon/Icon";

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="bg-white/5 p-6 rounded-lg text-left">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-primary">{icon}</div>
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    <p className="text-gray-300 text-sm">{children}</p>
  </div>
);

const WelcomeScreen: React.FC = () => {
  const { openLoginModal, openSignupModal } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary/30 z-0"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full opacity-40 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full opacity-40 animate-pulse animation-delay-4000"></div>

      {/* Main content */}
      <div className="relative z-10 text-center p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <SparklesIcon className="h-6 w-6 text-primary" />
          <span className="text-gray-300 font-medium">Powered by Financly AI</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          Experience Full-Strength <span className="text-primary">Financly</span>.
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Every AI insight, subscription hunter, and forecasting tool is now free to explore—no upgrades required.
        </p>

        <div className="mb-12">
          <img
            src="https://i.imgur.com/dwo4hf2.png"
            alt="Preview of Financly AI's subscription hunter interface"
            className="mx-auto rounded-xl shadow-2xl border border-white/10 max-w-full"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={openSignupModal}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow hover:bg-primary/90 transition"
          >
            Sign Up
          </button>
          <button
            onClick={openLoginModal}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold shadow hover:bg-gray-600 transition"
          >
            Login
          </button>
        </div>

        <p className="text-gray-400 mb-12">
          Once signed in, you’ll connect your bank securely with Basiq sandbox or live credentials.
          Your personal dashboard will light up instantly with every Financly AI tool.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
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
