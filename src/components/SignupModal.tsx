import React, { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeEmailToNewsletter } from "../hooks/useNewsletterSignup";
import { UserMembershipType } from "../types";

const avatarOptions = ["🪙", "🚀", "🌱", "🎯", "🛟", "💡", "🧠", "💼"];

const planOptions: Array<{
  id: UserMembershipType;
  title: string;
  emoji: string;
  copy: string;
  headline: string;
}> = [
  {
    id: "Basic",
    title: "Free Basic Showcase",
    emoji: "🎁",
    headline: "Unlock a 7-day guided preview",
    copy:
      "Try MyAiBank with one full-featured showcase. We'll highlight the insights you could unlock by upgrading to Pro.",
  },
  {
    id: "Pro",
    title: "MyAiBank Pro",
    emoji: "🌟",
    headline: "Always-on AI co-pilot",
    copy:
      "Instant access to Subscription Hunter, AI alerts, savings coaching, and proactive cashflow forecasting.",
  },
];

const SignupModal: React.FC = () => {
  const { isSignupModalOpen, setIsSignupModalOpen, signup, remainingBasicDays } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState<"AU" | "US">("AU");
  const [plan, setPlan] = useState<UserMembershipType>("Basic");
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinNewsletter, setJoinNewsletter] = useState(false);

  const basicCountdown = useMemo(() => {
    if (remainingBasicDays == null) return "7 days included";
    if (remainingBasicDays === 0) return "Trial expired";
    return `${remainingBasicDays} days left`;
  }, [remainingBasicDays]);

  if (!isSignupModalOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Enter a valid email and password.");
      return;
    }
    if (!displayName.trim()) {
      setError("Let us know what to call you.");
      return;
    }

    setIsSubmitting(true);
    const trimmedEmail = email.trim();
    const ok = signup({ email: trimmedEmail, password, region, plan, displayName, avatar });
    if (!ok) {
      setIsSubmitting(false);
      setError("That email is already registered.");
      return;
    }
    if (joinNewsletter) {
      try {
        await subscribeEmailToNewsletter(trimmedEmail);
      } catch (newsletterError) {
        console.error("Unable to subscribe to newsletter from signup", newsletterError);
      }
    }
    setIsSubmitting(false);
    setEmail("");
    setPassword("");
    setDisplayName("");
    setJoinNewsletter(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 sm:py-10">
      <div className="relative w-full max-w-3xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl bg-white text-gray-900 shadow-2xl dark:bg-neutral-900 dark:text-white sm:rounded-3xl">
        <button
          onClick={() => setIsSignupModalOpen(false)}
          className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close signup"
        >
          ✕
        </button>
        <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:p-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <header className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
                Get started
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                Create your MyAiBank profile
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your email doubles as your secure Basiq connection ID. We use it to sync your live bank data once you connect.
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Display name</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  placeholder="e.g. Alex"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Region</span>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as "AU" | "US")}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="AU">Australia</option>
                  <option value="US">United States</option>
                </select>
              </label>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Choose your vibe
              </h3>
              <div className="flex flex-wrap gap-2">
                {avatarOptions.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl transition ${
                      avatar === emoji
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 text-gray-500 hover:border-primary/40 hover:text-primary"
                    } dark:border-neutral-700 dark:text-neutral-300`}
                    aria-label={`Select avatar ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Pick a plan
                </h3>
                <span className="text-xs font-semibold text-primary">{basicCountdown}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {planOptions.map((option) => {
                  const isActive = plan === option.id;
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => setPlan(option.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isActive
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-gray-200 bg-white/60 hover:border-primary/40 hover:shadow"
                      } dark:border-neutral-700 dark:bg-neutral-800`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-2xl">{option.emoji}</span>
                        {isActive && <span className="rounded-full bg-primary px-2 text-xs font-semibold text-white">Selected</span>}
                      </div>
                      <h4 className="mt-3 text-lg font-semibold">{option.title}</h4>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
                        {option.headline}
                      </p>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{option.copy}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-inner dark:bg-slate-800/60 dark:text-slate-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                checked={joinNewsletter}
                onChange={(event) => setJoinNewsletter(event.target.checked)}
              />
              <span>
                <span className="font-semibold text-slate-700 dark:text-white">Receive financial news</span>
                <span className="block text-xs text-slate-500 dark:text-slate-300">
                  Stay on top of financial news and budgeting tips — we’ll add you to the MyAiBank briefing list.
                </span>
              </span>
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating your account..." : plan === "Pro" ? "Join MyAiBank Pro" : "Start my free showcase"}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              By continuing you agree that this preview is educational. MyAiBank surfaces opportunities but does not provide financial advice.
            </p>
          </form>

          <aside className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-6 dark:from-primary/20 dark:via-primary/5 dark:to-secondary/20">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Why people upgrade</h3>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-200">
                  <li>🔍 Spot hidden subscriptions and fees automatically.</li>
                  <li>🤖 AI explains your debt-to-income ratio in plain English.</li>
                  <li>🎯 Goal planner celebrates every milestone with personal tips.</li>
                  <li>📈 Cashflow forecasting shows your break-even trendline.</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 text-sm text-gray-700 shadow-md dark:bg-neutral-900/80 dark:text-gray-200">
                <p className="font-semibold">Need a faster entry?</p>
                <p className="mt-1">Use Google or Apple on your next visit — social sign-ins land here soon.</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Have questions? Email <a href="mailto:hello@myaibank.ai" className="font-semibold text-primary">hello@myaibank.ai</a> and our team will help you connect your bank securely.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
