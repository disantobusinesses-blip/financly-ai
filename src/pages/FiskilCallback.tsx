import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BankCallback: React.FC = () => {
  const [status, setStatus] = useState("Confirming your bank connection...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finalize = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setError(sessionError?.message || "Please log in to finalise your connection.");
        return;
      }

      const params = new URLSearchParams(window.location.search);

      // Accept common variations.
      // Your server stores this as profiles.fiskil_user_id (end user id).
      const endUserIdFromUrl =
        params.get("end_user_id") ||
        params.get("endUserId") ||
        params.get("userId") ||
        null;

      // Pull from profile as fallback (best source in your architecture)
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("fiskil_user_id")
        .eq("id", sessionData.session.user.id)
        .maybeSingle();

      if (profileErr) {
        setError(profileErr.message);
        return;
      }

      const fiskilUserId =
        (profileData as { fiskil_user_id?: string | null } | null)?.fiskil_user_id ||
        endUserIdFromUrl;

      if (!fiskilUserId) {
        setError("Missing bank user id. Please restart the bank connection from onboarding.");
        return;
      }

      try {
        const res = await fetch("/api/mark-bank-connected", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ end_user_id: fiskilUserId }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Unable to update bank connection");
        }

        setStatus("Connection confirmed. Redirecting...");
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
        <p className="text-lg font-semibold">
          {error ? "Bank connection error" : "Confirming your account"}
        </p>
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

export default BankCallback;