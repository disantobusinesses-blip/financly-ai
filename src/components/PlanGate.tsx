import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface PlanGateProps {
  allowBasic?: boolean;
  feature: string;
  teaser?: string;
  children: React.ReactNode;
  dataTourId?: string;
}

const PlanGate: React.FC<PlanGateProps> = ({ allowBasic = false, feature, teaser, children, dataTourId }) => {
  const { user, setIsUpgradeModalOpen } = useAuth();
  const shouldGate = user?.membershipType === "Basic" && !allowBasic;

  return (
    <div className="relative h-full" data-tour-id={dataTourId}>
      <div className={shouldGate ? "pointer-events-none select-none opacity-35" : ""}>{children}</div>
      {shouldGate && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-full w-full">
            <div className="absolute inset-1.5 flex items-center justify-center sm:inset-2">
              <div className="flex h-full w-full flex-col items-center justify-center gap-5 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-center text-white shadow-2xl ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Preview unlocked</p>
                <h3 className="text-3xl font-bold leading-tight">See {feature} insights</h3>
                {teaser ? (
                  <p className="max-w-sm text-sm text-white/80">{teaser}</p>
                ) : (
                  <p className="max-w-sm text-sm text-white/80">We found powerful savings insights locked behind this card. Upgrade to reveal them.</p>
                )}
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
                >
                  Upgrade to MyAiBank Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanGate;
