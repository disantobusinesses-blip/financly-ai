import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface PlanGateProps {
  locked: boolean;
  headline: string;
  message: string;
  highlight?: string;
  footnote?: string;
  children: React.ReactNode;
}

const formatDaysRemaining = (expiresAt?: string) => {
  if (!expiresAt) return null;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  const diffMs = parsed.getTime() - now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil(diffMs / dayMs);
  return { days, expired: diffMs <= 0 };
};

const PlanGate: React.FC<PlanGateProps> = ({
  locked,
  headline,
  message,
  highlight,
  footnote,
  children,
}) => {
  const { user, setIsUpgradeModalOpen } = useAuth();

  if (!locked) {
    return <>{children}</>;
  }

  const countdown = formatDaysRemaining(user?.basicTrialEndsAt);
  const badgeText = countdown
    ? countdown.expired
      ? "Basic showcase expired"
      : `${countdown.days} day${countdown.days === 1 ? "" : "s"} left in your basic showcase`
    : "Basic showcase preview";

  const badgeTone = countdown?.expired ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600";

  const greeting = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none filter blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 text-center shadow-2xl ring-1 ring-slate-200">
          <p className={`inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${badgeTone}`}>
            {badgeText}
          </p>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">{headline}</h3>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          {highlight && (
            <p className="mt-3 text-sm font-semibold text-primary">
              {highlight}
            </p>
          )}
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="mt-5 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-primary/90"
          >
            Upgrade to My Finances Pro
          </button>
          <p className="mt-3 text-xs text-slate-400">
            Hey {greeting}, unlocking Pro reveals every insight, removes the blur, and keeps your showcase history safe.
          </p>
          {footnote && (
            <p className="mt-2 text-xs text-slate-500">{footnote}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanGate;
