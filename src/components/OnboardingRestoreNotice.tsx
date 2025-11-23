import React from "react";
import { useOnboarding } from "../contexts/OnboardingContext";
import { useAuth } from "../contexts/AuthContext";

const OnboardingRestoreNotice: React.FC = () => {
  const { onboardingState, restoreSource, loading, error } = useOnboarding();
  const { user } = useAuth();

  if (!user || loading) return null;
  if (!restoreSource && onboardingState.status === "idle") return null;

  const sourceLabel = restoreSource === "supabase" ? "Supabase" : "your device";
  const statusLabel =
    onboardingState.status === "completed"
      ? "We marked your onboarding as complete."
      : `You can continue from step ${onboardingState.step || 1}.`;
  const lastUpdatedLabel = onboardingState.lastUpdated
    ? `Last updated ${new Date(onboardingState.lastUpdated).toLocaleString()}.`
    : "";

  return (
    <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 text-primary px-4 py-3 text-sm">
      <p className="font-semibold">Onboarding restored from {sourceLabel}</p>
      <p className="text-primary/90 text-xs">{statusLabel} {lastUpdatedLabel}</p>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default OnboardingRestoreNotice;
