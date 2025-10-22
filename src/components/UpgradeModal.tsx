import React, { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SparklesIcon } from "./icon/Icon";

const formatDaysRemaining = (expiresAt?: string) => {
  if (!expiresAt) return null;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return null;
  const diffMs = parsed.getTime() - Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil(diffMs / dayMs);
  return { days, expired: diffMs <= 0 };
};

const FeatureList: React.FC<{ title: string; items: string[]; highlight?: boolean }> = ({
  title,
  items,
  highlight = false,
}) => (
  <div
    className={`rounded-2xl border border-slate-200 p-6 ${
      highlight ? "bg-primary/5 ring-1 ring-primary/20" : "bg-white"
    }`}
  >
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <ul className="mt-4 space-y-2 text-sm text-slate-600">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen, user, upgradeUser } = useAuth();

  const countdown = useMemo(() => formatDaysRemaining(user?.basicTrialEndsAt), [user?.basicTrialEndsAt]);

  if (!isUpgradeModalOpen) return null;

  const handleUpgrade = () => {
    if (!user) return;
    upgradeUser(user.id);
    setIsUpgradeModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
      onClick={() => setIsUpgradeModalOpen(false)}
    >
      <div
        className="max-w-3xl w-full overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-center">
          <SparklesIcon className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Unlock My Finances Pro</h2>
          <p className="mt-2 text-sm text-slate-600">
            Reveal the full dashboard, AI forecasts, and subscription details instantly. We keep every suggestion neutral—this is
            not Financial advice.
          </p>
          {countdown && (
            <p
              className={`mt-3 text-sm font-semibold ${
                countdown.expired ? "text-rose-500" : "text-indigo-600"
              }`}
            >
              {countdown.expired
                ? "Your basic showcase has ended."
                : `${countdown.days} day${countdown.days === 1 ? "" : "s"} left in your basic showcase.`}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <FeatureList
            title="Basic Showcase"
            items={[
              "Financial Wellness Score & insights",
              "Balance summary with net worth snapshot",
              "Goal planner with AI celebration toasts",
              "Blurred previews of advanced tools",
            ]}
          />
          <FeatureList
            title="My Finances Pro"
            highlight
            items={[
              "Full Subscription Hunter with merchants and savings",
              "AI cashflow forecasts and spending analysis",
              "Real-time alerts, bills, and transaction history",
              "Unlimited goal tracking with live bank data",
              "Gemini-powered insights and category breakdowns",
            ]}
          />
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleUpgrade}
            className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:bg-primary/90"
          >
            Upgrade to My Finances Pro
          </button>
          <button
            onClick={() => setIsUpgradeModalOpen(false)}
            className="w-full rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-600 transition hover:border-primary hover:text-primary"
          >
            Maybe later
          </button>
          <p className="text-center text-xs text-slate-400">
            Pro access removes every blur so you can see where to save, how to budget, and which subscriptions to cancel today.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
