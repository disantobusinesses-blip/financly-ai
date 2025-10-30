import React from "react";
import { GaugeIcon, ChartIcon, LoanIcon, SparklesIcon } from "./icon/Icon";

const SandboxShowcase: React.FC = () => {
  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 text-white">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-900 p-10 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              <SparklesIcon className="h-4 w-4" />
              Live sandbox preview
            </span>
            <h1 className="text-3xl font-black leading-tight md:text-4xl lg:text-5xl">
              See how MyAiBank analyses your finances before you connect a bank.
            </h1>
            <p className="max-w-2xl text-base text-slate-200 md:text-lg">
              This sandbox view mirrors the real dashboard layout. Explore how the Financial Wellness score, goals, subscription tracking, and AI insights appear once your transactions sync.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-200">
            <div className="rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white shadow-inner">
              • Drag or swipe to explore each tool on mobile.
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white shadow-inner">
              • Upgrade cards tease real savings waiting behind the Basic preview.
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white shadow-inner">
              • Goals, wellness tips, and cashflow adjust with your live data.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-white/10 bg-white/5 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)]">
        <div className="flex flex-col gap-8 p-8 lg:p-12">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Pinned insights</p>
              <h2 className="text-2xl font-bold md:text-3xl">Financial Wellness & Goals</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                The sandbox highlights a healthy score of 82/100, a debt-to-income ratio of 32%, and a balanced 50/30/20 split. Goal planner cards sit directly beneath with milestone celebrations.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
              <span className="rounded-full bg-primary/20 px-4 py-2 text-primary">Swipe ready</span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-white/80">Tour enabled</span>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6 rounded-3xl bg-white/10 p-6 text-left shadow-lg backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">Financial Wellness</p>
                  <h3 className="text-3xl font-black text-white">82 / 100</h3>
                  <p className="text-sm text-slate-200">Debt-to-income at 32%. Weekly surplus of A$460 recommended for goals.</p>
                </div>
                <div className="grid gap-2 text-xs text-slate-200">
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>Emergency fund</span>
                    <span className="font-semibold text-white">4.5 months</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>Savings rate</span>
                    <span className="font-semibold text-white">22%</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">Essentials</p>
                  <p className="mt-2 text-2xl font-bold text-white">48%</p>
                  <p className="text-xs text-slate-300">A$3,840 per month</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">Lifestyle</p>
                  <p className="mt-2 text-2xl font-bold text-white">27%</p>
                  <p className="text-xs text-slate-300">A$2,160 per month</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">Savings</p>
                  <p className="mt-2 text-2xl font-bold text-white">25%</p>
                  <p className="text-xs text-slate-300">A$2,000 per month</p>
                </div>
              </div>
            </section>

            <aside className="flex flex-col gap-4 rounded-3xl bg-white/10 p-6 shadow-lg backdrop-blur">
              <div className="rounded-2xl bg-white/10 p-5 text-sm text-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">Goal planner</p>
                <h4 className="mt-2 text-xl font-semibold text-white">Europe Trip ✈️</h4>
                <p className="mt-1">A$6,000 target • 58% saved • ETA 5 months. Add contributions to see celebratory shout-outs.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-5 text-sm text-slate-200">
                <h4 className="text-xl font-semibold text-white">New EV 🚗</h4>
                <p className="mt-1">Automatic timeline: 35% complete. Suggested weekly save A$220 to finish in 8 months.</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-5 text-sm text-primary">
                <p className="text-xs font-semibold uppercase tracking-[0.4em]">Guided tour</p>
                <p className="mt-2 text-white">Tap "Need a tour?" on the dashboard to relaunch this step-by-step walkthrough.</p>
              </div>
            </aside>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-3xl bg-white/10 p-6 text-left shadow-lg">
              <div className="flex items-center gap-3 text-white">
                <GaugeIcon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Balance summary</h3>
              </div>
              <p className="text-sm text-slate-200">
                Spending available: <span className="font-semibold text-white">A$20,679</span>. Total net worth combines savings, investments, and mortgages for a holistic picture.
              </p>
              <div className="rounded-2xl bg-white/5 p-4 text-xs text-slate-200">
                Mortgage • -A$773,994
              </div>
              <div className="rounded-2xl bg-white/5 p-4 text-xs text-slate-200">
                Savings • A$118,200
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-white/10 p-6 text-left shadow-lg">
              <div className="flex items-center gap-3 text-white">
                <ChartIcon className="h-6 w-6 text-secondary" />
                <h3 className="text-lg font-semibold">Cashflow insights</h3>
              </div>
              <p className="text-sm text-slate-200">Monthly trendline with zero baseline, AI explanations, and consistent dollar formatting.</p>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Projected surplus</span>
                  <span className="font-semibold text-white">A$1,140</span>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Upcoming bills</span>
                  <span className="font-semibold text-white">A$420</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-white/10 p-6 text-left shadow-lg">
              <div className="flex items-center gap-3 text-white">
                <LoanIcon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Subscription Hunter</h3>
              </div>
              <p className="text-sm text-slate-200">
                Basic preview teases <span className="font-semibold text-white">3 hidden subscriptions</span> worth A$42/month. Upgrade to reveal merchants and cancellation tips.
              </p>
              <div className="rounded-2xl border border-dashed border-white/30 p-4 text-center text-xs text-slate-200">
                Upgrade to uncover merchants, cancelation instructions, and savings suggestions.
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-sm text-slate-300">
        Looking for the real dashboard? Connect your bank from the header once you sign up — this sandbox will disappear and your personalised data takes over.
      </footer>
    </div>
  );
};

export default SandboxShowcase;
