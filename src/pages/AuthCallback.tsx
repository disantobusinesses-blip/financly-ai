import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getStoredSession, supabaseGetUser } from "../lib/supabaseClient";
import { supabase, SupabaseSession } from "../supabaseClient";

const parseSessionFromUrl = (): SupabaseSession | null => {
  const hashParams = new URLSearchParams(window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "");
  const searchParams = new URLSearchParams(window.location.search);
  const source = hashParams.get("access_token") ? hashParams : searchParams;
  const accessToken = source.get("access_token");
  const refreshToken = source.get("refresh_token");
  if (!accessToken || !refreshToken) return null;

  const expiresIn = source.get("expires_in");
  const tokenType = source.get("token_type") || "bearer";
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn ? Number(expiresIn) : undefined,
    token_type: tokenType,
    user: { id: "" },
  };
};

const navigate = (path: string) => {
  if (window.location.pathname !== path) {
    window.history.replaceState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
};

const AuthCallback: React.FC = () => {
  const { syncSession } = useAuth();
  const [status, setStatus] = useState<"checking" | "error">("checking");

  useEffect(() => {
    let active = true;

    const resolveSession = async () => {
      const sessionFromUrl = parseSessionFromUrl();
      if (sessionFromUrl) {
        const { user } = await supabaseGetUser(sessionFromUrl.access_token);
        if (!user) {
          if (active) setStatus("error");
          return;
        }
        const hydratedSession: SupabaseSession = { ...sessionFromUrl, user };
        await syncSession(hydratedSession);
        window.history.replaceState({}, "", "/auth/callback");
      }

      const stored = getStoredSession();
      if (!stored?.access_token) {
        if (active) setStatus("error");
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        setStatus("error");
        return;
      }

      const onboardingComplete = Boolean((data.user as { user_metadata?: Record<string, unknown> }).user_metadata?.onboarding_complete);
      const finalSession = stored.user ? stored : { ...stored, user: data.user };
      await syncSession(finalSession);

      navigate(onboardingComplete ? "/app" : "/onboarding");
    };

    void resolveSession();

    return () => {
      active = false;
    };
  }, [syncSession]);

  return (
    <div className="px-4 pb-16 pt-24 text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-black uppercase tracking-[0.22em]">MyAiBank</h1>
        {status === "checking" ? (
          <p className="text-white/70">Confirming your account…</p>
        ) : (
          <div className="space-y-3">
            <p className="text-lg font-semibold">We couldn’t verify your session.</p>
            <p className="text-white/70">Return to onboarding to request a new link.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
