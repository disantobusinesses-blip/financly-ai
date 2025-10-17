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
          <SubscriptionHunterIllustration />
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
