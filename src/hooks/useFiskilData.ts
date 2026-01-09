// src/hooks/useFiskilData.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Account, AccountType, Transaction } from "../types";

const ACCOUNT_TYPE_VALUES = new Set(Object.values(AccountType));

const parseAmount = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const m = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (m?.[0]) return Number(m[0]) || 0;
  }
  if (value && typeof value === "object") {
    const v: any = value;
    return parseAmount(v.current ?? v.available ?? v.amount ?? v.value ?? v.balance ?? 0);
  }
  return 0;
};

const mapAccountType = (rawType: unknown, name: string): AccountType => {
  if (ACCOUNT_TYPE_VALUES.has(rawType as AccountType)) return rawType as AccountType;
  const src = `${rawType || name}`.toLowerCase();
  if (src.includes("savings")) return AccountType.SAVINGS;
  if (src.includes("credit")) return AccountType.CREDIT_CARD;
  if (src.includes("loan") || src.includes("mortgage")) return AccountType.LOAN;
  return AccountType.CHECKING;
};

const normalizeAccount = (raw: any): Account => {
  const name = String(raw?.name || raw?.accountName || raw?.displayName || "Account").trim();
  const type = mapAccountType(raw?.type?.text || raw?.type || raw?.accountType, name);
  let balance = parseAmount(raw?.balance?.current ?? raw?.balance ?? raw?.amount ?? 0);

  if ((type === AccountType.CREDIT_CARD || type === AccountType.LOAN) && balance > 0) {
    balance = -Math.abs(balance);
  }

  return {
    id: String(raw?.id || raw?.accountId),
    name,
    type,
    balance,
    currency: raw?.currency || "AUD",
  };
};

const normalizeTransaction = (raw: any): Transaction => {
  const date = new Date(
    raw?.date || raw?.postedAt || raw?.transactionDate || raw?.createdAt || Date.now()
  ).toISOString();

  return {
    id: String(raw?.id || `${raw?.description}-${date}`),
    accountId: String(raw?.account_id || raw?.accountId),
    description: String(raw?.description || raw?.merchant?.name || "Transaction"),
    amount: parseAmount(raw?.amount),
    date,
    category: String(raw?.category || "Other"),
  };
};

export interface SyncStatus {
  user_id: string;
  fiskil_user_id: string | null;
  has_bank_connection: boolean;
  last_transactions_sync_at: string | null;
  profile_updated_at: string | null;
  accounts_count: number;
  transactions_count: number;
}

export interface FiskilDataResult {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;

  // Sync status (Supabase import progress)
  syncStatus: SyncStatus | null;
  syncing: boolean;
  syncProgress: number; // 0..100
  syncMessage: string;
  syncDetails: string | null;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function deriveProgress(status: SyncStatus | null): { syncing: boolean; progress: number; message: string } {
  if (!status) return { syncing: false, progress: 0, message: "" };

  if (!status.fiskil_user_id && !status.has_bank_connection) {
    return { syncing: false, progress: 0, message: "" };
  }

  const hasEndUser = Boolean(status.fiskil_user_id);
  const hasAccounts = (status.accounts_count || 0) > 0;
  const hasTransactions = (status.transactions_count || 0) > 0;

  if (hasTransactions) return { syncing: false, progress: 100, message: "Data imported. Loading dashboard…" };
  if (hasAccounts) return { syncing: true, progress: 75, message: "Accounts imported. Waiting for transactions…" };
  if (status.has_bank_connection || hasEndUser)
    return { syncing: true, progress: 35, message: "Connection confirmed. Waiting for bank data…" };

  return { syncing: true, progress: 10, message: "Starting bank sync…" };
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function useFiskilData(identityKey?: string): FiskilDataResult {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncDetails, setSyncDetails] = useState<string | null>(null);

  const fetchedOnceRef = useRef(false);
  const pollingRef = useRef<number | null>(null);
  const pollAttemptsRef = useRef(0);
  const lastFetchAtRef = useRef<number>(0);

  const derived = useMemo(() => deriveProgress(syncStatus), [syncStatus]);

  useEffect(() => {
    let cancelled = false;

    const clearPoll = () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      pollAttemptsRef.current = 0;
    };

    const fetchFiskilData = async (jwt: string) => {
      // Throttle to avoid rapid double-calls
      const now = Date.now();
      if (now - lastFetchAtRef.current < 1000) return;
      lastFetchAtRef.current = now;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/fiskil-data", {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: "no-store",
        });
        const payload = await safeJson(res);

        if (!res.ok) {
          const msg = typeof payload?.error === "string" ? payload.error : "Failed to load bank data";
          if (msg.toLowerCase().includes("no connected bank")) {
            if (!cancelled) {
              setAccounts([]);
              setTransactions([]);
              setError("No connected bank account yet.");
            }
            return;
          }
          throw new Error(msg);
        }

        const acc = Array.isArray(payload.accounts) ? payload.accounts.map(normalizeAccount) : [];
        const tx = Array.isArray(payload.transactions) ? payload.transactions.map(normalizeTransaction) : [];

        if (!cancelled) {
          setAccounts(acc);
          setTransactions(tx);
          setLastUpdated(new Date().toISOString());
          fetchedOnceRef.current = true;
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            fetchedOnceRef.current
              ? "We’re reconnecting to your bank. Showing last known data."
              : e?.message || "Failed to load bank data"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchSyncStatus = async (jwt: string) => {
      try {
        const res = await fetch("/api/sync-status", {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: "no-store",
        });
        const payload = await safeJson(res);
        if (!res.ok) {
          // Don’t hard-fail the dashboard if sync-status fails.
          if (!cancelled) setSyncDetails(`sync-status error: ${payload?.error || res.status}`);
          return null;
        }
        if (!cancelled) {
          setSyncStatus(payload as SyncStatus);
          setSyncDetails(null);
        }
        return payload as SyncStatus;
      } catch (e: any) {
        if (!cancelled) setSyncDetails(`sync-status failed: ${e?.message || String(e)}`);
        return null;
      }
    };

    const startPollIfNeeded = (status: SyncStatus | null, jwt: string) => {
      if (!status) return;

      const shouldPoll =
        (status.has_bank_connection || Boolean(status.fiskil_user_id)) &&
        ((status.accounts_count || 0) === 0 || (status.transactions_count || 0) === 0);

      if (!shouldPoll) {
        clearPoll();
        return;
      }

      // Poll for up to ~2 minutes (40 attempts @ 3s)
      if (pollingRef.current) return;

      pollingRef.current = window.setInterval(async () => {
        if (cancelled) return;
        pollAttemptsRef.current += 1;

        const latest = await fetchSyncStatus(jwt);

        // If importer has populated supabase, re-fetch fiskil-data now.
        if (latest && (latest.transactions_count || 0) > 0) {
          clearPoll();
          await fetchFiskilData(jwt);
          return;
        }

        if (pollAttemptsRef.current >= 40) {
          clearPoll();
        }
      }, 3000);
    };

    const run = async () => {
      setLoading(true);
      setError(null);

      const session = (await supabase.auth.getSession()).data.session;
      const jwt = session?.access_token;
      if (!jwt) {
        if (!cancelled) {
          setAccounts([]);
          setTransactions([]);
          setError("Please log in to view your bank data.");
          setLoading(false);
        }
        return;
      }

      // Always fetch sync status first so the UI can show progress immediately.
      const status = await fetchSyncStatus(jwt);
      startPollIfNeeded(status, jwt);

      // Fetch current fiskil-data (may be empty while sync is pending)
      await fetchFiskilData(jwt);
    };

    void run();

    const refreshInterval = window.setInterval(async () => {
      const session = (await supabase.auth.getSession()).data.session;
      const jwt = session?.access_token;
      if (!jwt) return;
      await fetchSyncStatus(jwt);
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearPoll();
      window.clearInterval(refreshInterval);
    };
  }, [identityKey]);

  return {
    accounts,
    transactions,
    loading,
    error,
    mode: "live",
    lastUpdated,
    syncStatus,
    syncing: derived.syncing,
    syncProgress: clamp(derived.progress, 0, 100),
    syncMessage: derived.message,
    syncDetails,
  };
}
