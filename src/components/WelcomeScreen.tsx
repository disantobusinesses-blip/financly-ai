import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SparklesIcon, GaugeIcon, ChartIcon } from "./icon/Icon";
import { useBrevoNewsletter } from "../hooks/useBrevoNewsletter";

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
  const [email, setEmail] = useState("");
  const { status, error, subscribe, reset } = useBrevoNewsletter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await subscribe(email.trim());
    if (result.ok) {
      setEmail("");
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (status === "error") {
      reset();
    }

    setEmail(event.target.value);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950" />
      <div className="pointer-events-none absolute -left-24 -top-32 hidden h-96 w-96 rounded-full bg-primary/40 blur-3xl sm:block" />
      <div className="pointer-events-none absolute -right-24 bottom-0 hidden h-[28rem] w-[28rem] rounded-full bg-indigo-600/40 blur-[160px] sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-72 -translate-y-1/2 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.35),_transparent_65%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              1 free showcase available
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Confused about your finances? Let our AI co-pilot cut budgeting time by 60%.
              </h1>
              <p className="mx-auto max-w-xl text-lg text-white/70 lg:mx-0">
                Preview the dashboard tour, see how much you could save, and learn exactly where to focus first—without the overwhelm.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <button
                onClick={openSignupModal}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-primary/40 transition hover:bg-primary/90"
              >
                Get started
              </button>
              <button
                onClick={openLoginModal}
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white"
              >
                Login
              </button>
            </div>

            <div className="mx-auto w-full max-w-lg rounded-2xl bg-white/5 p-5 text-left shadow-lg shadow-black/10 backdrop-blur sm:p-6 lg:mx-0">
              <p className="text-sm text-white/80">
                Be on top of financial news and receive free tips on how to budget.
              </p>
              <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
                <label htmlFor="welcome-newsletter" className="sr-only">
                  Email address
                </label>
                <input
                  id="welcome-newsletter"
                  type="email"
                  placeholder="you@email.com"
                  className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Joining…" : "Join the list"}
                </button>
              </form>
              <div className="min-h-[1.25rem] pt-1 text-sm" aria-live="polite" role="status">
                {status === "success" && (
                  <span className="text-emerald-200">You're all set! Please check your inbox for a welcome message.</span>
                )}
                {status === "error" && error && <span className="text-rose-200">{error}</span>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard icon={<GaugeIcon />} title="Wellness score">
                Get a clear score out of 100 with guidance on ratios, savings, and next steps tailored to you.
              </FeatureCard>
              <FeatureCard icon={<SparklesIcon />} title="Subscription Hunter">
                Forgot what you subscribed to? Find them with our subscription hunter and spot instant savings.
              </FeatureCard>
              <FeatureCard icon={<ChartIcon />} title="Smart cashflow">
                Our AI forecasts your spend, highlights risks, and recommends adjustments before payday.
              </FeatureCard>
            </div>

          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm rounded-[2rem] bg-white/5 p-6 shadow-lg shadow-black/20 sm:max-w-md lg:max-w-xl">
              <div className="absolute inset-x-12 -top-6 hidden h-20 rounded-full bg-gradient-to-r from-primary/40 to-indigo-500/40 blur-3xl sm:block" aria-hidden="true" />
              <div className="relative flex h-full min-h-[18rem] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center">
                <SparklesIcon className="h-10 w-10 text-primary" />
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">See Financly in action</h2>
                  <p className="text-sm text-white/70">
                    Explore live insights, swipe through tools, and preview how Financly uncovers savings for you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomeScreen;
