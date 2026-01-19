import React from "react";

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onLogin: () => void;
  onDashboard?: () => void;
};

const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5 12h12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SparklesIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2l1.4 5.8L19 10l-5.6 1.2L12 17l-1.4-5.8L5 10l5.6-2.2L12 2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4 16l6-6 4 4 6-8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 6h6v6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ValueRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  sub: string;
}> = ({ icon, title, sub }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-900/50 flex items-center justify-center flex-shrink-0">
      <span className="text-purple-400">{icon}</span>
    </div>
    <div>
      <h3 className="text-white font-medium text-sm mb-1">{title}</h3>
      <p className="text-gray-400 text-xs leading-relaxed">{sub}</p>
    </div>
  </div>
);

export default function WelcomeScreen({ onGetStarted, onLogin }: WelcomeScreenProps) {
  return (
    <main className="min-h-[calc(100dvh-5rem)] flex items-center justify-center px-4 pb-16 pt-10">
      <div className="w-full max-w-[430px]">
        <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-[3.5rem] border border-gray-700 shadow-2xl overflow-hidden">
          <div className="px-6 py-8 flex flex-col h-[720px] max-h-[78vh] justify-between">
            {/* Progress */}
            <div className="text-center">
              <p className="text-gray-400 text-xs">Step 1 of 6</p>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center px-2">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center">
                  <span className="text-white">
                    <SparklesIcon className="w-10 h-10" />
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-white text-4xl font-bold text-center mb-4">
                Welcome to
                <br />
                MyAiBank
              </h1>

              {/* Value Props */}
              <div className="space-y-4 mb-8">
                <ValueRow
                  icon={<TrendingUpIcon />}
                  title="Smart Forecasting"
                  sub="Predict your cashflow with AI-powered insights"
                />
                <ValueRow
                  icon={<ShieldIcon />}
                  title="Bank-Level Security"
                  sub="Your data is encrypted and protected 24/7"
                />
                <ValueRow
                  icon={<SparklesIcon />}
                  title="AI Assistant"
                  sub="Get personalized financial advice instantly"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="px-2">
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
              >
                Begin
                <ArrowRightIcon />
              </button>

              <p className="text-gray-500 text-xs text-center mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
