import React from "react";

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onLogin: () => void;
  onDashboard?: () => void;
};

const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 16l6-6 4 4 6-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

const FeatureRow: React.FC<{ icon: React.ReactNode; title: string; sub: string }> = ({ icon, title, sub }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0b0b10] shadow-sm">
      <span className="text-purple-400">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-white/60">{sub}</p>
    </div>
  </div>
);

export default function WelcomeScreen({ onGetStarted, onLogin, onDashboard }: WelcomeScreenProps) {
  return (
    <main className="min-h-[100dvh] px-4 pb-14 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
      {/* Full-page background (no phone cutout) */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute -left-40 -top-44 h-[520px] w-[520px] rounded-full bg-[#1F0051]/25 blur-3xl" />
        <div className="absolute -right-44 -bottom-44 h-[520px] w-[520px] rounded-full bg-white/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[520px]">
        <p className="text-center text-xs font-semibold text-white/50">Step 1 of 6</p>

        <div className="mt-12 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_18px_70px_rgba(79,43,255,0.35)]">
            <SparklesIcon className="h-10 w-10 text-white" />
          </div>
        </div>

        <h1 className="mt-10 text-center text-5xl font-semibold leading-[1.02] text-white">
          Welcome to
          <br />
          MyAiBank
        </h1>

        <div className="mt-12 space-y-6">
          <FeatureRow
            icon={<TrendingUpIcon />}
            title="Smart Forecasting"
            sub="Predict your cashflow with AI-powered insights"
          />
          <FeatureRow
            icon={<ShieldIcon />}
            title="Bank-Level Security"
            sub="Your data is encrypted and protected 24/7"
          />
          <FeatureRow
            icon={<SparklesIcon />}
            title="AI Assistant"
            sub="Get personalized financial guidance instantly"
          />
        </div>

        <button
          type="button"
          onClick={onGetStarted}
          className="mt-12 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-[0_20px_80px_rgba(79,43,255,0.35)] transition hover:opacity-95"
        >
          <span className="inline-flex items-center justify-center gap-2">
            Begin <ArrowRightIcon className="h-5 w-5" />
          </span>
        </button>

        <p className="mt-6 text-center text-sm text-white/55">
          Already have an account?{" "}
          <button type="button" onClick={onLogin} className="font-semibold text-purple-400 hover:text-purple-300">
            Sign in
          </button>
        </p>

        {onDashboard ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onDashboard}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            >
              Continue to dashboard
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}