import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

interface Props {
  onComplete: () => void;
}

const SubscriptionSuccessPage: React.FC<Props> = ({ onComplete }) => {
  const { session, refreshProfile } = useAuth();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    const activate = async () => {
      if (!session?.access_token) {
        setStatus("error");
        return;
      }
      const response = await fetch("/api/subscription/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      await supabase.auth.updateUser({ data: { onboarding_complete: true } });
      await refreshProfile();
      setStatus("success");
      setTimeout(onComplete, 800);
    };
    void activate();
  }, [session?.access_token, onComplete, refreshProfile]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 text-white">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-bold">Subscription</h1>
        {status === "pending" && <p className="text-white/70">Activating your subscription…</p>}
        {status === "success" && <p className="text-emerald-200">Subscription activated. Redirecting…</p>}
        {status === "error" && (
          <div className="space-y-3">
            <p className="text-rose-200">We couldn’t confirm your subscription.</p>
            <button
              className="interactive-primary rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
              onClick={onComplete}
            >
              Back to subscribe
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
