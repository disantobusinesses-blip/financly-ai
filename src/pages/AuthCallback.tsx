import React, { useEffect, useState } from "react";
import { getStoredSession, SupabaseSession, supabaseGetUser } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

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

const AuthCallback: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { syncSession } = useAuth();
  const [status, setStatus] = useState<"checking" | "error">("checking");

  useEffect(() => {
    let active = true;
    const resolveSession = async () => {
      const fromUrl = parseSessionFromUrl();
      if (fromUrl) {
        const { user } = await supabaseGetUser(fromUrl.access_token);
        if (!user) {
          if (active) setStatus("error");
          return;
        }
        const sessionWithUser: SupabaseSession = {
          ...fromUrl,
          user,
        };
        if (!active) return;
        await syncSession(sessionWithUser);
        onComplete();
        return;
      }

      const stored = getStoredSession();
      if (stored && active) {
        await syncSession(stored);
        onComplete();
        return;
      }

      if (active) setStatus("error");
    };

    void resolveSession();
    return () => {
      active = false;
    };
  }, [onComplete, syncSession]);

  return (
    <div className="px-4 pb-16 pt-24 text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-black uppercase tracking-[0.22em]">MyAiBank</h1>
        {status === "checking" ? (
          <p className="text-white/70">Finishing sign-in and preparing your workspace…</p>
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
