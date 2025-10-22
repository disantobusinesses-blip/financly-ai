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
    <div className="relative" data-tour-id={dataTourId}>
      <div className={shouldGate ? "pointer-events-none select-none opacity-40" : ""}>{children}</div>
      {shouldGate && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-3xl bg-slate-950/85 p-6 text-center text-white shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Preview locked</p>
            <h3 className="text-xl font-bold">Unlock {feature}</h3>
            {teaser && <p className="text-sm text-white/80">{teaser}</p>}
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanGate;
