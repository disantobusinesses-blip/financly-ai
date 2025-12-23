import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FiskilCallback: React.FC = () => {
  const [status, setStatus] = useState("Finalising bank connection…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          throw new Error(sessionError?.message || "Please log in to finalise your connection.");
        }

        const accessToken = sessionData.session.access_token;
        const params = new URLSearchParams(window.location.search);

        const endUserIdFromUrl =
          params.get("end_user_id") || params.get("endUserId") || params.get("userId") || null;

        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("fiskil_user_id")
          .eq("id", sessionData.session.user.id)
          .maybeSingle();

        if (profileErr) throw new Error(profileErr.message);

        const fiskilUserId =
          (profileData as { fiskil_user_id?: string | null } | null)?.fiskil_user_id ||
          endUserIdFromUrl;

        if (!fiskilUserId) {
          throw new Error("Missing bank user id. Please restart the bank connection from onboarding.");
        }

        // 1) Mark connected
        setStatus("Confirming connection…");
        const markRes = await fetch("/api/mark-bank-connected", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ end_user_id: fiskilUserId }),
        });

        if (!markRes.ok) {
          const text = await markRes.text();
          throw new Error(text || "Unable to update bank connection");
        }

        // 2) Poll refresh-transactions until data exists + imported
        setStatus("Syncing accounts and transactions…");

        const MAX_POLLS = 50; // 50 * ~6s = ~5 minutes
        for (let i = 1; i <= MAX_POLLS; i++) {
          const r = await fetch("/api/refresh-transactions", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const text = await r.text();
          let payload: any = null;
          try {
            payload = text ? JSON.parse(text) : null;
          } catch {
            payload = null;
          }

          if (r.status === 200 && payload?.success) {
            setStatus("Done. Redirecting…");
            window.location.replace("/app/dashboard?bank_connected=1");
            return;
          }

          if (r.status === 202 && payload?.pending) {
            const waitSeconds =
              typeof payload?.retry_after_seconds === "number" ? payload.retry_after_seconds : 6;
            setStatus(`Finalising bank connection… (${i}/${MAX_POLLS})`);
            await sleep(waitSeconds * 1000);
            continue;
          }

          throw new Error(
            payload?.error || payload?.message || text || `Unexpected response (${r.status})`
          );
        }

        throw new Error(
          "Bank connected, but Fiskil still has no accounts for this user after several minutes. This usually means the consent flow didn’t actually complete."
        );
      } catch (e: any) {
        setError(e?.message || "Unable to finalise your bank connection.");
      }
    };

    void run();
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 text-center text-white">
      <div className="max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-lg font-semibold">
          {error ? "Bank connection error" : "Finalising connection"}
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

export default FiskilCallback;
