import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { BankingService, initiateBankConnection } from "../services/BankingService";

type ConnectionStatus = "pending" | "connected" | null;

const OnboardingPage: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [connectingBank, setConnectingBank] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [pendingEndUserId, setPendingEndUserId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    BankingService.getConnectionStatus() as ConnectionStatus
  );
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const finalizeConnection = useCallback(
    async (endUserId: string, tokenOverride?: string) => {
      setError(null);
      setFinalizing(true);
      setStatus("Finalising your bank connection...");

      try {
        const accessToken = tokenOverride || sessionToken;
        if (!accessToken) {
          throw new Error("Please log in to finish onboarding.");
        }

        // 1) Mark bank connected (stores fiskil_user_id / has_bank_connection)
        const markRes = await fetch("/api/mark-bank-connected", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ end_user_id: endUserId }),
        });

        if (!markRes.ok) {
          const text = await markRes.text();
          throw new Error(text || "Unable to finalise bank connection.");
        }

        // 2) Pull transactions NOW so the dashboard has data immediately
        setStatus("Syncing your transactions...");
        const refreshRes = await fetch("/api/refresh-transactions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!refreshRes.ok) {
          const text = await refreshRes.text();
          throw new Error(text || "Bank connected, but we couldn’t sync transactions yet.");
        }

        BankingService.setConnectionStatus("connected");
        setConnectionStatus("connected");
        setStatus("Bank connected! Redirecting...");
        onComplete?.();

        setTimeout(() => {
          window.location.replace("/app/dashboard");
        }, 600);
      } catch (err: any) {
        setError(err?.message || "Unable to finalise your bank connection.");
      } finally {
        setFinalizing(false);
      }
    },
    [onComplete, sessionToken]
  );

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.replace("/dashboard");
        return;
      }

      setSessionToken(data.session.access_token);

      const params = new URLSearchParams(window.location.search);
      const endUserFromUrl =
        params.get("end_user_id") || params.get("endUserId") || params.get("userId") || null;

      if (endUserFromUrl) {
        BankingService.setStoredEndUserId(endUserFromUrl);
        BankingService.setConnectionStatus("pending");
        window.history.replaceState({}, "", "/Onboarding");
      }

      const storedEndUserId = BankingService.getStoredEndUserId();
      const storedStatus = BankingService.getConnectionStatus() as ConnectionStatus;

      setPendingEndUserId(storedEndUserId);
      setConnectionStatus(storedStatus);

      if (storedStatus === "pending" && storedEndUserId) {
        await finalizeConnection(storedEndUserId, data.session.access_token);
      }

      setLoading(false);
    };

    void init();
  }, [finalizeConnection]);

  const handleConnectBank = async () => {
    setError(null);
    setConnectingBank(true);

    try {
      const token = sessionToken || (await supabase.auth.getSession()).data.session?.access_token || null;
      if (!token) {
        throw new Error("Please log in to connect your bank.");
      }

      const { redirectUrl, endUserId } = await initiateBankConnection(token);

      // Store for when we return (Fiskil may not include end_user_id in the redirect)
      BankingService.setStoredEndUserId(endUserId);
      BankingService.setConnectionStatus("pending");

      setPendingEndUserId(endUserId);
      setConnectionStatus("pending");
      setStatus("Redirecting to securely connect your bank...");
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err?.message || "Unable to start bank connection.");
    } finally {
      setConnectingBank(false);
    }
  };

  if (loading) {
    return <div className="px-4 py-24 text-center text-white">Loading onboarding...</div>;
  }

  return (
    <div className="px-4 pb-16 pt-24 text-white">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">Connect your bank</p>
        <h1 className="text-3xl font-black uppercase tracking-[0.22em]">MyAiBank</h1>
        <div className="space-y-2">
          <p className="text-xl font-semibold">Secure bank connection</p>
          <p className="text-white/70">
            We will redirect you to Fiskil to securely link your accounts, then confirm the
            connection back here.
          </p>
        </div>

        {status && <p className="rounded-xl bg-white/5 px-4 py-3 text-white/80">{status}</p>}
        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-red-200">{error}</p>}

        {connectionStatus === "pending" && pendingEndUserId ? (
          <div className="space-y-4">
            <p className="text-white/80">You returned from Fiskil. Finalise your connection to continue.</p>
            <button
              type="button"
              onClick={() => void finalizeConnection(pendingEndUserId)}
              className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white disabled:opacity-60"
              disabled={finalizing}
            >
              {finalizing ? "Finalising connection..." : "Complete connection"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-white/70">Start by connecting your bank.</p>
            <button
              type="button"
              onClick={handleConnectBank}
              className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white disabled:opacity-60"
              disabled={connectingBank}
            >
              {connectingBank ? "Starting connection..." : "Connect your bank"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
