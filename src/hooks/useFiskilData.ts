// src/hooks/useFiskilData.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Account, AccountType, Transaction } from "../types";

const ACCOUNT_TYPE_VALUES = new Set(Object.values(AccountType));

// How often we poll while waiting for Fiskil to return accounts/transactions.
const POLL_MS = 4000;

export type SyncStage =
  | "no_connection"
  | "awaiting_accounts"
  | "awaiting_transactions"
  | "ready"
  | "error";

export interface SyncStatus {
  stage: SyncStage;
  progress: number;
  message: string;
}

export interface FiskilDataResult {
  connected: boolean;
  accounts: Account[];
  transactions: Transaction[];
  lastUpdated: string | null;
  syncStatus: SyncStatus;
  debugInfo?: any;
}

export function useFiskilData(userId: string | null | undefined) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    stage: "no_connection",
    progress: 0,
    message: "Bank not connected yet.",
  });
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const mountedRef = useRef(true);
  const pollTimerRef = useRef<number | null>(null);

  const normalizeAccountType = (raw: any): AccountType => {
    if (ACCOUNT_TYPE_VALUES.has(raw)) return raw as AccountType;
    const lower = String(raw ?? "").toLowerCase();
    if (lower.includes("credit")) return AccountType.CREDIT_CARD;
    if (lower.includes("loan")) return AccountType.LOAN;
    return AccountType.CHECKING;
  };

  const normalizeAccounts = (rawAccounts: any[]): Account[] =>
    rawAccounts.map((acc) => ({
      id: String(acc.id),
      name: String(acc.name ?? acc.display_name ?? acc.provider_name ?? "Bank Account"),
      institution: String(acc.institution ?? acc.provider_name ?? acc.provider?.name ?? "Bank"),
      balance: Number(acc.balance ?? acc.current_balance ?? 0),
      currency: String(acc.currency ?? "AUD"),
      type: normalizeAccountType(acc.type),
      lastUpdated: acc.last_updated ?? acc.updated_at ?? new Date().toISOString(),
    }));

  const normalizeTransactions = (rawTx: any[]): Transaction[] =>
    rawTx.map((tx) => ({
      id: String(tx.id),
      accountId: String(tx.account_id ?? tx.accountId ?? ""),
      date: String(tx.date ?? tx.posted_at ?? tx.created_at ?? new Date().toISOString()),
      description: String(tx.description ?? tx.merchant ?? tx.narrative ?? "Transaction"),
      amount: Number(tx.amount ?? 0),
      category: String(tx.category ?? "Uncategorized"),
      type: tx.amount < 0 ? "debit" : "credit",
      merchant: tx.merchant ?? null,
      reference: tx.reference ?? null,
      isPending: Boolean(tx.is_pending ?? tx.pending ?? false),
    }));

  const clearPolling = () => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const schedulePoll = (fn: () => void) => {
    clearPolling();
    pollTimerRef.current = window.setTimeout(fn, POLL_MS) as unknown as number;
  };

  const fetchOnce = useCallback(async (): Promise<FiskilDataResult> => {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      throw new Error("Not authenticated");
    }

    const res = await fetch("/api/fiskil-data", {
      method: "GET",
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch Fiskil data");
    }

    const data = await res.json();

    const rawAccounts = Array.isArray(data.accounts) ? data.accounts : [];
    const rawTransactions = Array.isArray(data.transactions) ? data.transactions : [];
    const nextConnected = Boolean(data.connected);

    const nextSyncStatus: SyncStatus = data?.syncStatus?.stage
      ? {
          stage: data.syncStatus.stage,
          progress: Number(data.syncStatus.progress ?? 0),
          message: String(data.syncStatus.message ?? ""),
        }
      : nextConnected
      ? rawAccounts.length === 0
        ? { stage: "awaiting_accounts", progress: 35, message: "Waiting for bank accounts…" }
        : rawTransactions.length === 0
        ? { stage: "awaiting_transactions", progress: 60, message: "Waiting for transactions…" }
        : { stage: "ready", progress: 100, message: "Bank data loaded." }
      : { stage: "no_connection", progress: 0, message: "Bank not connected yet." };

    return {
      connected: nextConnected,
      accounts: normalizeAccounts(rawAccounts),
      transactions: normalizeTransactions(rawTransactions),
      lastUpdated: data.last_updated ?? null,
      syncStatus: nextSyncStatus,
      debugInfo: data.debug ?? null,
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchOnce();
      if (!mountedRef.current) return;

      setConnected(data.connected);
      setSyncStatus(data.syncStatus);
      setLastUpdated(data.lastUpdated);
      setDebugInfo(data.debugInfo);

      // Only overwrite visible data if we actually have some.
      if (data.accounts.length) setAccounts(data.accounts);
      if (data.transactions.length) setTransactions(data.transactions);

      // Keep polling while we're still waiting for accounts/tx.
      if (data.syncStatus.stage === "awaiting_accounts" || data.syncStatus.stage === "awaiting_transactions") {
        schedulePoll(() => void refresh());
      } else {
        clearPolling();
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message || "Failed to load bank data");
      setSyncStatus({ stage: "error", progress: 0, message: "Error loading bank data." });
      clearPolling();
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [fetchOnce]);

  useEffect(() => {
    mountedRef.current = true;

    if (!userId) {
      setLoading(false);
      setConnected(false);
      setAccounts([]);
      setTransactions([]);
      setLastUpdated(null);
      setSyncStatus({ stage: "no_connection", progress: 0, message: "Bank not connected yet." });
      return () => {
        mountedRef.current = false;
        clearPolling();
      };
    }

    void refresh();

    return () => {
      mountedRef.current = false;
      clearPolling();
    };
  }, [userId, refresh]);

  return {
    accounts,
    transactions,
    loading,
    error,
    lastUpdated,
    connected,
    syncStatus,
    debugInfo,
    refresh,
  };
}
