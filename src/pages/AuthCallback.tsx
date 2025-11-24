import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<"checking" | "error">("checking");

  useEffect(() => {
    const resolve = async () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        window.history.replaceState({}, "", "/auth/callback");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setStatus("error");
        return;
      }

      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) {
        setStatus("error");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();

      const isOnboarded = Boolean((profile as { is_onboarded?: boolean } | null)?.is_onboarded);
      window.location.replace(isOnboarded ? "/app/dashboard" : "/onboarding");
    };

    void resolve();
  }, []);

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
