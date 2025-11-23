import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { OnboardingState } from "../types";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "./AuthContext";

interface OnboardingContextType {
  onboardingState: OnboardingState;
  loading: boolean;
  error: string | null;
  restoreSource: "supabase" | "local" | null;
  saveProgress: (snapshot: Partial<OnboardingState>) => Promise<void>;
  markComplete: () => Promise<void>;
  reset: () => void;
}

const defaultState: OnboardingState = {
  step: 0,
  status: "idle",
  data: {},
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const localKeyFor = (userId?: string, email?: string | null) =>
  ["financly_onboarding", userId || email || "anonymous"].join("_");

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreSource, setRestoreSource] = useState<"supabase" | "local" | null>(null);

  const persistLocally = useCallback(
    (state: OnboardingState, scopeKey?: string) => {
      const key = localKeyFor(scopeKey || user?.id, user?.email);
      localStorage.setItem(key, JSON.stringify(state));
    },
    [user?.email, user?.id]
  );

  const loadFromLocal = useCallback(
    (scopeKey?: string) => {
      const key = localKeyFor(scopeKey || user?.id, user?.email);
      const saved = localStorage.getItem(key);
      if (!saved) return null;
      try {
        return JSON.parse(saved) as OnboardingState;
      } catch (err) {
        console.warn("Failed to parse cached onboarding state", err);
        return null;
      }
    },
    [user?.email, user?.id]
  );

  const pushToSupabase = useCallback(
    async (state: OnboardingState) => {
      if (!supabase || !user?.id) return;
      const { error: supabaseError } = await supabase.auth.updateUser({
        data: { onboarding_state: state },
      });
      if (supabaseError) {
        console.warn("Unable to persist onboarding state to Supabase", supabaseError.message);
        setError(supabaseError.message);
      }
    },
    [user?.id]
  );

  const hydrateFromSupabase = useCallback(async () => {
    if (!supabase) return false;
    const { data } = await supabase.auth.getUser();
    const remoteState = data.user?.user_metadata?.onboarding_state as OnboardingState | undefined;
    if (remoteState) {
      const enriched: OnboardingState = {
        ...remoteState,
        email: remoteState.email || data.user?.email || user?.email,
        region: remoteState.region || user?.region,
      };
      setOnboardingState(enriched);
      persistLocally(enriched, data.user?.id);
      setRestoreSource("supabase");
      return true;
    }
    return false;
  }, [persistLocally, user?.email, user?.region]);

  const restoreState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const restoredFromRemote = await hydrateFromSupabase();
      if (restoredFromRemote) return;

      const local = loadFromLocal();
      if (local) {
        setOnboardingState(local);
        setRestoreSource("local");
      } else {
        setOnboardingState(defaultState);
        setRestoreSource(null);
      }
    } catch (err: any) {
      console.error("Failed to restore onboarding state", err);
      setError(err.message || "Unable to restore onboarding state");
    } finally {
      setLoading(false);
    }
  }, [hydrateFromSupabase, loadFromLocal]);

  useEffect(() => {
    restoreState();
  }, [restoreState, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (restoreSource === "local") {
      pushToSupabase({ ...onboardingState, email: user.email, region: user.region });
      setRestoreSource("supabase");
    }
  }, [onboardingState, pushToSupabase, restoreSource, user]);

  const saveProgress = useCallback(
    async (snapshot: Partial<OnboardingState>) => {
      const next: OnboardingState = {
        ...defaultState,
        ...onboardingState,
        ...snapshot,
        step: snapshot.step ?? onboardingState.step ?? 0,
        status: snapshot.status || onboardingState.status || "in_progress",
        email: snapshot.email || onboardingState.email || user?.email,
        region: snapshot.region || onboardingState.region || user?.region,
        lastUpdated: new Date().toISOString(),
      };

      setOnboardingState(next);
      persistLocally(next);
      await pushToSupabase(next);
    },
    [onboardingState, persistLocally, pushToSupabase, user?.email, user?.region]
  );

  const markComplete = useCallback(async () => {
    await saveProgress({ status: "completed" });
  }, [saveProgress]);

  const reset = useCallback(() => {
    setOnboardingState(defaultState);
    setRestoreSource(null);
    if (user) {
      const key = localKeyFor(user.id, user.email);
      localStorage.removeItem(key);
    }
  }, [user]);

  const value = useMemo(
    () => ({ onboardingState, loading, error, restoreSource, saveProgress, markComplete, reset }),
    [error, loading, markComplete, onboardingState, reset, restoreSource, saveProgress]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = (): OnboardingContextType => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
};
