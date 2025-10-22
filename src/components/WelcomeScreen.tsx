import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { SparklesIcon, GaugeIcon, LoanIcon, ChartIcon } from "./icon/Icon";
import { useNewsletterSignup } from "../hooks/useNewsletterSignup";

const WelcomeScreen: React.FC = () => {
  const { openLoginModal, openSignupModal } = useAuth();
  const {
    email,
    setEmail,
    status,
    submit,
    reset,
  } = useNewsletterSignup();

  const handleNewsletterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 px-4 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center space-y-8 rounded-3xl bg-white/5 p-8 backdrop-blur-lg lg:p-12">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">
            <SparklesIcon className="h-5 w-5" />
            <span>One free showcase available</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
              Confused about your finances? <span className="text-primary">Have our AI help.</span>
            </h1>
            <p className="text-lg text-slate-200 md:text-xl">
              Cut budgeting time by 70%. Preview your wellness score, cashflow forecast, and subscription intelligence in a single guided experience built for mobile and desktop.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={openSignupModal}
              className="rounded-2xl bg-primary px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-primary/90"
            >
              Get started
            </button>
            <button
              onClick={openLoginModal}
              className="rounded-2xl border border-white/40 px-6 py-3 text-lg font-semibold text-white transition hover:border-white"
            >
              Login
            </button>
          </div>

          <div className="rounded-2xl bg-white/10 p-6 text-sm leading-relaxed text-slate-100 backdrop-blur">
            <h3 className="mb-3 text-base font-semibold uppercase tracking-widest text-primary/90">
              Be on top of financial news
            </h3>
            <p className="text-sm text-slate-200">
              Receive free budgeting tips, product updates, and smart ways to stretch your savings. We only send what helps you take action.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/40 bg-white/20 px-4 py-3 text-base text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-white px-5 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/60"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Joining..." : status === "success" ? "Added!" : "Join newsletter"}
              </button>
              {status === "success" && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm font-semibold text-white/70 hover:text-white"
                >
                  Add another
                </button>
              )}
            </form>
            {status === "error" && (
              <p className="mt-3 text-xs text-red-200">
                Something went wrong. Please double-check your email and try again.
              </p>
            )}
          </div>
        </section>

        <aside className="flex flex-col justify-center gap-6 rounded-3xl bg-white/10 p-8 text-slate-100 backdrop-blur-lg lg:p-10">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Tools you&apos;ll preview</h2>
            <p className="text-sm text-slate-200">
              Begin Financial Awareness to see how Financly AI guides every step — and what you unlock with My Finances Pro.
            </p>
          </div>

          <ul className="space-y-4 text-sm">
            <li className="rounded-2xl bg-white/5 p-4 shadow-lg">
              <div className="mb-2 flex items-center gap-3">
                <GaugeIcon className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold text-white">Financial Wellness</h3>
              </div>
              <p className="text-slate-200">Score out of 100, debt-to-income coaching, and 50/30/20 allocations tailored to your spending.</p>
            </li>
            <li className="rounded-2xl bg-white/5 p-4 shadow-lg">
              <div className="mb-2 flex items-center gap-3">
                <ChartIcon className="h-6 w-6 text-secondary" />
                <h3 className="text-base font-semibold text-white">Smart Cashflow</h3>
              </div>
              <p className="text-slate-200">Baseline zero line, AI insights, and swipe-friendly dashboards for every device.</p>
            </li>
            <li className="rounded-2xl bg-white/5 p-4 shadow-lg">
              <div className="mb-2 flex items-center gap-3">
                <LoanIcon className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold text-white">Subscription Hunter</h3>
              </div>
              <p className="text-slate-200">Forgot what you subscribed to? Find them all and see how much you could save.</p>
            </li>
          </ul>

          <div className="rounded-2xl bg-white/5 p-6 text-sm text-slate-200">
            <p className="font-semibold text-white">Already Financially Aware?</p>
            <p className="mt-2">
              Log in anytime to reconnect your bank and pick up where you left off.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WelcomeScreen;
