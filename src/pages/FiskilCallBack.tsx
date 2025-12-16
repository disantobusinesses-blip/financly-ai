import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const FiskilCallBack: React.FC = () => {
  const [status, setStatus] = useState("Confirming your bank connection...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finalize = async () => {
      const params = new URLSearchParams(window.location.search);
      const looksCancelled =
        params.has("error") ||
        params.get("status") === "cancelled" ||
        params.get("status") === "canceled" ||
        params.get("cancelled") === "true" ||
        params.get("canceled") === "true";

      if (looksCancelled) {
        setError("Bank connection was cancelled.");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setError(sessionError?.message || "Please log in to finalise your connection.");
        return;
      }

      // Prefer explicit IDs from query params, but fall back to stored profile value.
      const queryEndUserId =
        params.get("end_user_id") || params.get("endUserId") || params.get("userId");

      let endUserId = queryEndUserId;
      if (!endUserId) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("fiskil_user_id")
          .eq("id", sessionData.session.user.id)
          .maybeSingle();

        if (profileError) {
          setError(profileError.message);
          return;
        }

        endUserId = (profileData as { fiskil_user_id?: string | null } | null)?.fiskil_user_id || null;
      }

      if (!endUserId) {
        setError("Missing Fiskil end user id. Please restart bank connection from onboarding.");
        return;
      }

      try {
        const res = await fetch("/api/mark-bank-connected", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ end_user_id: endUserId }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Unable to update bank connection");
        }

        setStatus("Connection confirmed. Redirecting...");
        window.history.replaceState({}, "", "/onboarding");
        window.location.replace("/app/dashboard");
      } catch (err: any) {
        setError(err?.message || "Unable to confirm your bank connection.");
      }
    };

    void finalize();
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 text-center text-white">
      <div className="max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-lg font-semibold">{error ? "Bank connection error" : "Confirming your account"}</p>
        <p className="text-white/70">{error || status}</p>
        {error && (
          <button
            type="button"
            onClick={() => window.location.replace("/onboarding")}
            className="interactive-primary mt-4 w-full rounded-xl bg-primary px-4 py-2 font-semibold text-white"
          >
            Return to onboarding
          </button>
        )}
      </div>
    </div>
  );
};

export default FiskilCallBack;
