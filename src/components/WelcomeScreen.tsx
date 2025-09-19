import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon, GaugeIcon, LoanIcon, ChartIcon } from './icon/Icon';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm text-left">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-primary">{icon}</div>
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    <p className="text-gray-300 text-sm">{children}</p>
  </div>
);

const Step: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="flex items-start gap-4 text-left">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
      {number}
    </div>
    <div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  </div>
);

const WelcomeScreen: React.FC = () => {
  const { setIsLoginModalOpen, setIsSignupModalOpen, login } = useAuth();

  const handleDemoLogin = () => {
    login('demo@financly.com', 'demo123');
  };

  return (
    <div className="flex items-center justify-center min-h-full bg-gray-900 text-white font-sans p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary/30 z-0"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-4000"></div>

      <div className="relative z-10 text-center p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <SparklesIcon className="h-6 w-6 text-primary" />
          <span className="text-gray-300 font-medium">Powered By Financly Ai</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          Unlock Your Financial <span className="text-primary">Potential</span>.
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Go beyond simple budgeting. See your forecast, find hidden subscriptions, and take control of your money.
        </p>

        {/* Feature Cards */}
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

        {/* 3-Step Onboarding */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-10 text-left space-y-4">
          <h3 className="text-lg font-bold mb-2">How it works</h3>
          <Step number="1" title="View your forecast" description="See your projected balance for the next 6 months." />
          <Step number="2" title="Find subscriptions" description="Spot recurring expenses like Netflix or Spotify." />
          <Step number="3" title="Upgrade for more" description="Unlock AI insights to save smarter and faster." />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleDemoLogin}
            className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/20 transition-colors duration-300"
          >
            Login with Demo Account
          </button>
          <button
            onClick={() => setIsSignupModalOpen(true)}
            className="w-full sm:w-auto bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-hover transition-colors duration-300 flex items-center justify-center gap-2"
          >
            Sign Up
          </button>
        </div>

        <div className="mt-4">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button onClick={() => setIsLoginModalOpen(true)} className="font-semibold text-primary hover:underline">
              Log In
            </button>
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-gray-400 text-sm">
          <span>🔒 Bank-grade encryption</span>
          <span>⚡ Powered by Basiq</span>
          <span>💳 Secure payments with Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
