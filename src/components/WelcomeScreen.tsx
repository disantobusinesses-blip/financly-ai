import React, { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SparklesIcon, GaugeIcon, LoanIcon, ChartIcon } from "./icon/Icon";
import { useNewsletterSignup } from "../hooks/useNewsletterSignup";
import LegalFooter from "./LegalFooter";
import StripePricingTable from "./StripePricingTable";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat("en-AU", {
  maximumFractionDigits: 1,
});

type Frequency = "monthly" | "fortnightly" | "weekly";

const FREQUENCY_MULTIPLIER: Record<Frequency, number> = {
  monthly: 1,
  fortnightly: 26 / 12,
  weekly: 52 / 12,
};

interface DemoResult {
  essentials: number;
  wants: number;
  savings: number;
  dti: number;
  normalisedIncome: number;
}

const AnimatedNumber: React.FC<{ value: number; format?: (value: number) => string }> = ({ value, format }) => {
  const [display, setDisplay] = useState(value);

  React.useEffect(() => {
    const start = display;
    const delta = value - start;
    if (Math.abs(delta) < 1) {
      setDisplay(value);
      return;
    }
    const duration = 600;
    let raf: number;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + delta * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const formatted = format ? format(display) : display.toFixed(0);
  return <span>{formatted}</span>;
};

const WelcomeScreen: React.FC = () => {
  const { openLoginModal, openSignupModal } = useAuth();
  const { email, setEmail, status, submit, reset } = useNewsletterSignup();
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [income, setIncome] = useState(5000);
  const [spending, setSpending] = useState(3500);
  const [result, setResult] = useState<DemoResult | null>(null);

  const handleNewsletterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit();
  };

  const handleDemoSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const multiplier = FREQUENCY_MULTIPLIER[frequency];
    const normalisedIncome = Math.max(0, Number(income) * multiplier);
    const normalisedSpending = Math.max(0, Number(spending) * multiplier);
    if (normalisedIncome === 0) {
      setResult(null);
      return;
    }
    const essentials = normalisedIncome * 0.5;
    const wants = normalisedIncome * 0.3;
    const savings = normalisedIncome * 0.2;
    const dti = (normalisedSpending / normalisedIncome) * 100;
    setResult({ essentials, wants, savings, dti, normalisedIncome });
  };

  const demoAdvice = useMemo(() => {
    if (!result) return "Run the demo to see where your money can go.";
    if (result.dti <= 36) return "Your debt-to-income ratio is healthy. Keep your emergency fund topped up.";
    if (result.dti <= 50) return "Tighten lifestyle spending slightly to free more for savings goals next month.";
    return "Spending is outpacing income—trim essentials where possible and set automatic transfers to savings.";
  }, [result]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-24 pt-28 text-white">
      <div className="glass-panel mx-auto flex w-full max-w-6xl flex-col gap-10 rounded-3xl p-8 shadow-2xl lg:flex-row lg:p-12">
        <section className="flex flex-1 flex-col justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">
              <SparklesIcon className="h-5 w-5" />
              <span>Experience the Future of Budgeting.</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
                First 500 users get <span className="text-primary-light">25% off for 6 months.</span>
              </h1>
              <p className="text-lg text-slate-200 md:text-xl">
                All-in-one cashflow, Financial Health scoring, and smart subscription intelligence designed for both mobile and desktop.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={openSignupModal}
                className="hover-zoom rounded-2xl bg-primary px-6 py-3 text-lg font-semibold text-white shadow-lg"
              >
                Get started
              </button>
              <button
                onClick={openLoginModal}
                className="hover-zoom rounded-2xl border border-white/40 px-6 py-3 text-lg font-semibold text-white"
              >
                Login
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 text-sm leading-relaxed text-slate-100">
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
                className="w-full rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                required
              />
              <button
                type="submit"
                className="hover-zoom rounded-xl bg-white px-5 py-3 text-base font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/60"
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
              <p className="mt-3 text-xs text-red-200">Something went wrong. Please double-check your email and try again.</p>
            )}
          </div>
        </section>

        <aside className="flex flex-1 flex-col gap-8">
          <div className="glass-panel rounded-3xl p-6 text-slate-100">
            <h2 className="text-2xl font-semibold text-white">What you&apos;ll preview</h2>
            <p className="mt-2 text-sm text-slate-200">
              Begin your free showcase to see how MyAiBank guides every decision.
            </p>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="futuristic-card rounded-2xl p-4">
                <div className="mb-2 flex items-center gap-3">
                  <GaugeIcon className="h-6 w-6 text-primary-light" />
                  <h3 className="text-base font-semibold text-white">Financial Health</h3>
                </div>
                <p className="text-slate-200">Score out of 100, debt-to-income coaching, and 50/30/20 allocations tailored to your spending.</p>
              </li>
              <li className="futuristic-card rounded-2xl p-4">
                <div className="mb-2 flex items-center gap-3">
                  <ChartIcon className="h-6 w-6 text-secondary" />
                  <h3 className="text-base font-semibold text-white">Smart Cashflow</h3>
                </div>
                <p className="text-slate-200">Baseline zero line, monthly projections, and swipe-friendly dashboards for every device.</p>
              </li>
              <li className="futuristic-card rounded-2xl p-4">
                <div className="mb-2 flex items-center gap-3">
                  <LoanIcon className="h-6 w-6 text-primary-light" />
                  <h3 className="text-base font-semibold text-white">Subscription Hunter</h3>
                </div>
                <p className="text-slate-200">Forgot what you subscribed to? Find them all and see how much you could save.</p>
              </li>
            </ul>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Already Financially Aware?</p>
              <p className="mt-1">Log in anytime to reconnect your bank and pick up where you left off.</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <header className="flex flex-col gap-2 text-center">
              <h3 className="text-lg font-semibold uppercase tracking-[0.3em] text-primary-light">The 50/30/20 Rule Demo</h3>
              <p className="text-sm text-slate-200">Find out your financial health Score</p>
              <p className="text-xs text-slate-400">Check your bank statement or estimate your monthly spending.</p>
            </header>
            <form onSubmit={handleDemoSubmit} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                Your income (after tax)
                <div className="mt-2 flex gap-3">
                  <select
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value as Frequency)}
                    className="w-32 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={income}
                    onChange={(event) => setIncome(Number(event.target.value))}
                    className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                    required
                  />
                </div>
              </label>
              <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                Your total spending
                <input
                  type="number"
                  min={0}
                  value={spending}
                  onChange={(event) => setSpending(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  required
                />
              </label>
              <button type="submit" className="hover-zoom w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white">
                Run demo
              </button>
            </form>
            {result && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="futuristic-card rounded-2xl p-4 text-sm text-white/80">
                  <p className="text-xs uppercase tracking-[0.3em] text-primary-light">Essentials 50%</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    <AnimatedNumber value={result.essentials} format={(val) => currencyFormatter.format(Math.round(val))} />
                  </p>
                  <p className="mt-1 text-xs text-white/60">Rent, mortgage, loans, groceries, insurance.</p>
                </div>
                <div className="futuristic-card rounded-2xl p-4 text-sm text-white/80">
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Wants 30%</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    <AnimatedNumber value={result.wants} format={(val) => currencyFormatter.format(Math.round(val))} />
                  </p>
                  <p className="mt-1 text-xs text-white/60">Lifestyle upgrades, dining, streaming, travel.</p>
                </div>
                <div className="futuristic-card rounded-2xl p-4 text-sm text-white/80">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Savings 20%</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    <AnimatedNumber value={result.savings} format={(val) => currencyFormatter.format(Math.round(val))} />
                  </p>
                  <p className="mt-1 text-xs text-white/60">Emergency fund, investing, goal accounts.</p>
                </div>
                <div className="futuristic-card rounded-2xl p-4 text-sm text-white/80">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">Debt-to-income ratio</p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    <AnimatedNumber value={result.dti} format={(val) => `${percentageFormatter.format(val)}%`} />
                  </p>
                  <p className="mt-1 text-xs text-white/60">Calculated from {currencyFormatter.format(Math.round(result.normalisedIncome))} income per month.</p>
                </div>
              </div>
            )}
            <p className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-white/70">{demoAdvice}</p>
          </div>
        </aside>
      </div>

      <StripePricingTable />

      <LegalFooter />
    </div>
  );
};

export default WelcomeScreen;
