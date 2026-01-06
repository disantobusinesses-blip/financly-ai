import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { BankingService, initiateBankConnection } from "../services/BankingService";
import type { User } from "../types";

type ConnectionStatus = "pending" | "connected" | null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [region, setRegion] = useState<User["region"]>("AU");

  const warmAIWithLatestData = useCallback(
    async (accessToken: string) => {
      if (!sessionUserId) return;

      const dataRes = await fetch("/api/fiskil-data", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      const payload = await dataRes.json();
      if (!dataRes.ok) {
        throw new Error(payload?.error || "Unable to fetch bank data for AI");
      }

      const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
      const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];

      // Don’t warm AI if nothing is there yet.
      if (accounts.length === 0 && transactions.length === 0) return;

      const totalBalance = accounts.reduce(
        (sum: number, account: any) => sum + (Number(account?.balance) || 0),
        0
      );
      const now = new Date();

      const aiRes = await fetch("/api/analyze-finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUserId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          region,
          accounts,
          transactions,
          totalBalance,
          forceRefresh: true,
        }),
      });

      if (!aiRes.ok) {
        const text = await aiRes.text();
        throw new Error(text || "Unable to warm AI analysis");
      }
    },
    [region, sessionUserId]
  );

  const pollRefreshTransactions = useCallback(async (accessToken: string) => {
    const MAX_POLLS = 60; // ~60 * 8s = 8 minutes
    for (let i = 1; i <= MAX_POLLS; i++) {
      const res = await fetch("/api/refresh-transactions", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 200) {
        return;
      }

      if (res.status === 202) {
        let payload: any = null;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }
        const wait = typeof payload?.retry_after_seconds === "number" ? payload.retry_after_seconds : 8;
        setStatus(`Syncing your transactions… (${i}/${MAX_POLLS})`);
        await sleep(wait * 1000);
        continue;
      }

      const text = await res.text();
      throw new Error(text || "Bank connected, but we couldn’t sync transactions yet.");
    }

    throw new Error(
      "Bank connected, but Fiskil did not provide accounts/transactions in time. Try again in a few minutes."
    );
  }, []);

  const finalizeConnection = useCallback(
    async (endUserId: string, tokenOverride?: string) => {
      setError(null);
      setFinalizing(true);
      setStatus("Finalising your bank connection...");

      try {
        const accessToken = tokenOverride || sessionToken;
        if (!accessToken) throw new Error("Please log in to finish onboarding.");

        // 1) Mark bank connected
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

        // 2) Poll until Fiskil data becomes available and is imported
        setStatus("Syncing your transactions…");
        await pollRefreshTransactions(accessToken);

        // 3) Warm AI (best effort)
        try {
          setStatus("Asking AI to personalise your dashboard...");
          await warmAIWithLatestData(accessToken);
        } catch (aiErr: any) {
          console.error("⚠️ AI warm-up failed", aiErr);
        }

        BankingService.setConnectionStatus("connected");
        setConnectionStatus("connected");
        BankingService.clearStoredEndUserId();

        setStatus("Bank connected! Redirecting...");
        onComplete?.();

        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 600);
      } catch (err: any) {
        setError(err?.message || "Unable to finalise your bank connection.");
      } finally {
        setFinalizing(false);
      }
    },
    [onComplete, pollRefreshTransactions, sessionToken, warmAIWithLatestData]
  );

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.replace("/login");
        return;
      }

      setSessionToken(data.session.access_token);
      setSessionUserId(data.session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("country")
        .eq("id", data.session.user.id)
        .maybeSingle();

      const country = (profile as { country?: string } | null)?.country;
      if (country === "AU" || country === "US") setRegion(country);

      const params = new URLSearchParams(window.location.search);
      const endUserFromUrl =
        params.get("end_user_id") || params.get("endUserId") || params.get("userId") || null;

      if (endUserFromUrl) {
        BankingService.setStoredEndUserId(endUserFromUrl);
        BankingService.setConnectionStatus("pending");

        // Clear query params, but keep correct route casing
        window.history.replaceState({}, "", "/onboarding");
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
      if (!token) throw new Error("Please log in to connect your bank.");

      const { redirectUrl, endUserId } = await initiateBankConnection(token);

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

        {status && <p className="rounded-xl bg-white/5 px-4 py-3 text-white/80">{status}</p>}
        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-red-200">{error}</p>}

        {connectionStatus === "pending" && pendingEndUserId ? (
          <div className="space-y-4">
            <p className="text-white/80">Finalising your connection…</p>
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
