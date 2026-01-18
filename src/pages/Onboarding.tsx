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
      const token = sessionToken || (await supabase.auth.getSession()).data.session?.access_token || null;
      if (!token) {
        throw new Error("Please log in to connect your bank.");
      }

      // DO NOT CHANGE: stable Fiskil connect flow
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

  const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-[#1F0051]/25 via-white/5 to-[#1F0051]/15 blur-3xl opacity-70" />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/50 backdrop-blur">
        {children}
      </div>
    </div>
  );

  return (
    <div className="px-4 pb-16 pt-10 text-white md:pt-14">
      <CardShell>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Onboarding</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Connect your bank</h1>
            <p className="mt-2 max-w-xl text-sm text-white/65">
              One secure connection. MyAiBank will pull your accounts and transactions so your dashboard can populate.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">Step</p>
            <p className="mt-1 text-sm font-semibold text-white">4 of 4</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Security</p>
          <p className="mt-2 text-sm text-white/75">
            Your credentials are handled by the provider. MyAiBank receives authorised data only.
          </p>
        </div>

        {status && <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">{status}</p>}
        {error && <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        <div className="mt-6">
          {connectionStatus === "connected" ? (
            <div className="space-y-4">
              <p className="text-sm text-white/80">Bank already connected.</p>
              <button
                type="button"
                onClick={() => {
                  onComplete?.();
                  window.location.replace("/app/dashboard");
                }}
                className="interactive-primary w-full rounded-2xl bg-[#1F0051] px-6 py-3 text-sm font-semibold text-white"
              >
                Go to dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleConnectBank}
                className="interactive-primary w-full rounded-2xl bg-[#1F0051] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={connectingBank}
              >
                {connectingBank ? "Starting connection…" : "Connect your bank"}
              </button>

              {connectionStatus === "pending" && (
                <p className="text-xs text-white/60">
                  Connection started. If you completed Fiskil and returned, it will finalise on the callback page.
                </p>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">Fast</p>
                  <p className="mt-2 text-sm text-white/75">Typically under 60 seconds.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">Private</p>
                  <p className="mt-2 text-sm text-white/75">Finance-only insights. No unrelated usage.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">Useful</p>
                  <p className="mt-2 text-sm text-white/75">Spending, subscriptions, categories, savings.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardShell>
    </div>
  );
};

export default OnboardingPage;
