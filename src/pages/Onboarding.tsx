import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { BankingService, initiateBankConnection } from "../services/BankingService";

type ConnectionStatus = "pending" | "connected" | null;

const OnboardingPage: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [connectingBank, setConnectingBank] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    BankingService.getConnectionStatus() as ConnectionStatus
  );
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.replace("/login");
        return;
      }

      setSessionToken(data.session.access_token);

      // If already marked as connected locally, allow user to continue.
      const storedStatus = BankingService.getConnectionStatus() as ConnectionStatus;
      setConnectionStatus(storedStatus);

      setLoading(false);
    };

    void init();
  }, []);

  const handleConnectBank = async () => {
    setError(null);
    setConnectingBank(true);

    try {
      const token =
        sessionToken || (await supabase.auth.getSession()).data.session?.access_token || null;
      if (!token) {
        throw new Error("Please log in to connect your bank.");
      }

      const { redirectUrl, endUserId } = await initiateBankConnection(token);

      BankingService.setStoredEndUserId(endUserId);
      BankingService.setConnectionStatus("pending");

      setConnectionStatus("pending");
      setStatus("Redirecting to securely connect your bank…");
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err?.message || "Unable to start bank connection.");
    } finally {
      setConnectingBank(false);
    }
  };

  if (loading) {
    return <div className="px-4 py-24 text-center text-white">Loading onboarding…</div>;
  }

  return (
    <div className="px-4 pb-16 pt-24 text-white">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">Connect your bank</p>
        <h1 className="text-3xl font-black uppercase tracking-[0.22em]">MyAiBank</h1>

        <div className="space-y-2">
          <p className="text-xl font-semibold">Secure bank connection</p>
          <p className="text-white/70">
            Connect once. We’ll pull your accounts and transactions, then your dashboard will populate.
          </p>
        </div>

        {status && <p className="rounded-xl bg-white/5 px-4 py-3 text-white/80">{status}</p>}
        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-red-200">{error}</p>}

        {connectionStatus === "connected" ? (
          <div className="space-y-4">
            <p className="text-white/80">Bank already connected.</p>
            <button
              type="button"
              onClick={() => {
                onComplete?.();
                window.location.replace("/app/dashboard");
              }}
              className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
            >
              Go to dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleConnectBank}
              className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white disabled:opacity-60"
              disabled={connectingBank}
            >
              {connectingBank ? "Starting connection…" : "Connect your bank"}
            </button>

            {connectionStatus === "pending" && (
              <p className="text-sm text-white/60">
                Connection started. If you completed Fiskil and returned, it will finalise on the callback page.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
