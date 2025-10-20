import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { SparklesIcon, GaugeIcon, LoanIcon, ChartIcon } from "./icon/Icon";

const SpotifyBadge = () => (
  <div className="w-11 h-11 rounded-2xl bg-[#1DB954] flex items-center justify-center shadow-inner">
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
      <circle cx="16" cy="16" r="13" fill="#1ED760" />
      <path
        d="M9.5 13.5c3.5-1 9-0.5 13 1.3"
        stroke="#0E3617"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.5 17c3-0.8 7.4-0.2 10.6 1"
        stroke="#0E3617"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M11.6 20c2.4-0.6 5.5-0.1 7.9 0.8"
        stroke="#0E3617"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

const NetflixBadge = () => (
  <div className="w-11 h-11 rounded-2xl bg-[#E50914] flex items-center justify-center shadow-inner">
    <span className="text-white text-2xl font-black tracking-tight">N</span>
  </div>
);

const DoggyTreatsBadge = () => (
  <div className="w-11 h-11 rounded-2xl bg-[#F97316] flex items-center justify-center shadow-inner">
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="#fff">
      <circle cx="10" cy="12" r="4" opacity="0.9" />
      <circle cx="22" cy="12" r="4" opacity="0.9" />
      <circle cx="13" cy="20" r="3.5" opacity="0.9" />
      <circle cx="19" cy="20" r="3.5" opacity="0.9" />
      <circle cx="16" cy="18" r="4.5" />
    </svg>
  </div>
);

const AmazonBadge = () => (
  <div className="w-11 h-11 rounded-2xl bg-[#FF9900] flex items-center justify-center shadow-inner">
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
      <path
        d="M9 11.5c0-2.5 1.8-4.2 4.3-4.2 1.6 0 2.8 0.7 3.6 1.8 0.6-1.1 1.8-1.8 3.3-1.8 2.3 0 4.3 1.6 4.3 4.4v9H21v-8.2c0-1.2-0.7-1.9-1.8-1.9-1 0-1.8 0.7-1.8 1.9V21h-3.3v-8.2c0-1.2-0.8-1.9-1.8-1.9-1 0-1.8 0.7-1.8 1.9V21H9v-9.5Z"
        fill="#fff"
      />
      <path d="M9 23c2.5 1.5 5 2.2 7 2.2s4.5-0.7 7-2.2" stroke="#2C1500" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  </div>
);

const AppleMusicBadge = () => (
  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FA243C] to-[#FD6F92] flex items-center justify-center shadow-inner">
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="#fff">
      <path d="M20 6v13.4c0 2.9-2 5.4-5 5.4s-5-2.5-5-5.4 2-5 5-5c1 0 1.9.3 2.7.8V6H20Z" />
      <circle cx="12" cy="21" r="2.4" opacity="0.7" />
      <circle cx="18" cy="19" r="2.4" opacity="0.7" />
    </svg>
  </div>
);

const SubscriptionHunterIllustration: React.FC = () => (
  <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white text-gray-900 shadow-[0_25px_60px_rgba(33,18,68,0.2)] overflow-hidden border border-purple-100">
    <div className="bg-gradient-to-r from-[#6f3cff] to-[#a366ff] px-8 py-5 flex items-center justify-between">
      <div className="flex items-center gap-3 text-white">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
          <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
            <path
              d="M16 4c5.523 0 10 4.477 10 10 0 4.386-2.834 8.108-6.77 9.443L16 28l-3.23-4.557C8.834 22.108 6 18.386 6 14c0-5.523 4.477-10 10-10Z"
              fill="url(#brainGradient)"
            />
            <path
              d="M20.5 13.5a1.5 1.5 0 0 1 0 3c-.828 0-1.5.672-1.5 1.5V19a1.5 1.5 0 0 1-3 0v-.25c0-.828-.672-1.5-1.5-1.5a1.5 1.5 0 0 1 0-3c.828 0 1.5-.672 1.5-1.5V11a1.5 1.5 0 0 1 3 0v1c0 .828.672 1.5 1.5 1.5Z"
              fill="#fff"
              opacity={0.85}
            />
            <defs>
              <linearGradient id="brainGradient" x1="8" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f7f0ff" />
                <stop offset="1" stopColor="#d4beff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <p className="text-sm uppercase tracking-widest text-white/70">Financly AI</p>
          <p className="text-xl font-semibold">Subscription Hunter</p>
        </div>
      </div>
      <button className="px-4 py-2 rounded-lg bg-white/15 text-white font-semibold text-sm border border-white/30 shadow hover:bg-white/25 transition">
        Cancel Subscription
      </button>
    </div>

    <div className="bg-[#f6f2ff] px-8 py-7">
      <p className="text-gray-600 text-base mb-6">View and manage your recurring payments.</p>

      <div className="space-y-4">
        {[
          {
            name: "Spotify",
            description: "SpotiFy",
            amount: "$8.99",
            date: "Apr 8",
            badge: <SpotifyBadge />,
          },
          {
            name: "Netflix",
            description: "Netflix",
            amount: "$15.49",
            date: "Apr 12",
            badge: <NetflixBadge />,
          },
          {
            name: "Doggy Treats Subscription",
            description: "Doggy Treats Subscription",
            amount: "$25.00",
            date: "Apr 5",
            badge: <DoggyTreatsBadge />,
          },
          {
            name: "Amazon Prime",
            description: "Amazon Prime",
            amount: "$14.99",
            date: "Apr 9",
            badge: <AmazonBadge />,
          },
          {
            name: "Apple Music",
            description: "Apple Music",
            amount: "$10.99",
            date: "Apr 11",
            badge: <AppleMusicBadge />,
          },
        ].map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm border border-purple-100"
          >
            <div className="flex items-center gap-4">
              {item.badge}
              <div>
                <p className="text-lg font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{item.amount}</p>
                <p className="text-sm text-gray-400">Due {item.date}</p>
              </div>
              <button className="px-4 py-2 rounded-lg border border-[#6f3cff] text-[#6f3cff] font-semibold text-sm hover:bg-[#f1ebff] transition">
                Cancel Subscription
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950" />
      <div className="pointer-events-none absolute -left-24 -top-32 hidden h-96 w-96 rounded-full bg-primary/40 blur-3xl sm:block" />
      <div className="pointer-events-none absolute -right-24 bottom-0 hidden h-[28rem] w-[28rem] rounded-full bg-indigo-600/40 blur-[160px] sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-72 -translate-y-1/2 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.35),_transparent_65%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              <SparklesIcon className="h-4 w-4" />
              1 free showcase available
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Explore Financly AI’s toolkit with a curated welcome tour.
              </h1>
              <p className="mx-auto max-w-xl text-lg text-white/70 lg:mx-0">
                Preview your wellness score, cashflow forecast, and subscription intelligence in a single guided experience built for mobile and desktop.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <button
                onClick={openSignupModal}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-primary/40 transition hover:bg-primary/90"
              >
                Start the showcase
              </button>
              <button
                onClick={openLoginModal}
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white"
              >
                I already have access
              </button>
            </div>

            <div className="mx-auto w-full max-w-lg rounded-2xl bg-white/5 p-5 text-left shadow-lg shadow-black/10 backdrop-blur sm:p-6 lg:mx-0">
              <p className="text-sm text-white/80">
                Be on top of financial news and receive free tips on how to budget.
              </p>
              <form className="mt-3 flex flex-col gap-3 sm:flex-row">
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
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 shadow sm:w-auto"
                >
                  Join the list
                </button>
              </form>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard icon={<GaugeIcon />} title="Wellness score">
                Your finances graded with actionable next steps.
              </FeatureCard>
              <FeatureCard icon={<LoanIcon />} title="Borrowing power">
                Understand what you can safely borrow before you apply.
              </FeatureCard>
              <FeatureCard icon={<ChartIcon />} title="Smart cashflow">
                Predict spend, spot trends, and reset budgets instantly.
              </FeatureCard>
            </div>

            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Connect securely with Basiq sandbox or live credentials.
            </p>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm rounded-[2rem] bg-white/5 p-5 shadow-lg shadow-black/20 sm:max-w-md sm:p-6 lg:max-w-xl lg:p-8">
              <div className="absolute inset-x-12 -top-6 hidden h-20 rounded-full bg-gradient-to-r from-primary/40 to-indigo-500/40 blur-3xl sm:block" aria-hidden="true" />
              <SubscriptionHunterIllustration />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomeScreen;
