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
    accountId: String(raw?.account_id || raw?.accountId || ""),
    description: String(raw?.description || raw?.merchant?.name || "Transaction"),
    amount: parseAmount(raw?.amount),
    date,
    category: String(raw?.category || "Other"),
  };
};

type FiskilMeta = { accounts_status?: number; transactions_status?: number };
type FiskilDataPayload = {
  connected?: boolean;
  end_user_id?: string;
  accounts?: any[];
  transactions?: any[];
  last_updated?: string | null;
  source?: string;
  fiskil?: FiskilMeta;
};

export interface FiskilDataResult {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;

  syncing: boolean;
  syncProgress: number;
  syncMessage: string;
  syncDetails: string | null;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function deriveProgress(args: { connected: boolean; a: number; t: number }): { syncing: boolean; p: number; msg: string } {
  if (!args.connected) return { syncing: false, p: 0, msg: "" };
  if (args.t > 0) return { syncing: false, p: 100, msg: "Transactions loaded. Loading dashboard…" };
  if (args.a > 0) return { syncing: true, p: 75, msg: "Accounts loaded. Waiting for transactions…" };
  return { syncing: true, p: 35, msg: "Connection confirmed. Waiting for bank data…" };
}

export function useFiskilData(identityKey?: string): FiskilDataResult {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [connected, setConnected] = useState(false);
  const [syncDetails, setSyncDetails] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const pollStartRef = useRef<number>(0);

  const derived = useMemo(() => {
    return deriveProgress({ connected, a: accounts.length, t: transactions.length });
  }, [connected, accounts.length, transactions.length]);

  useEffect(() => {
    let cancelled = false;

    const stopPolling = () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const fetchOnce = async (jwt: string) => {
      try {
        const res = await fetch("/api/fiskil-data", {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: "no-store",
        });

        const payload = (await safeJson(res)) as FiskilDataPayload;

        // If not connected, show CTA state
        if (!res.ok && res.status !== 202) {
          const msg = typeof (payload as any)?.error === "string" ? (payload as any).error : "Failed to load bank data";
          if (msg.toLowerCase().includes("no connected bank")) {
            if (!cancelled) {
              setConnected(false);
              setAccounts([]);
              setTransactions([]);
              setError("No connected bank account yet.");
              setSyncDetails(null);
            }
            return;
          }
          throw new Error(msg);
        }

        const accRaw = Array.isArray(payload.accounts) ? payload.accounts : [];
        const txRaw = Array.isArray(payload.transactions) ? payload.transactions : [];

        const acc = accRaw.map(normalizeAccount);
        const tx = txRaw.map(normalizeTransaction);

        const isConnected = Boolean(payload.connected);
        const eu = payload.end_user_id || "unknown";
        const aStatus = payload.fiskil?.accounts_status;
        const tStatus = payload.fiskil?.transactions_status;

        if (!cancelled) {
          setConnected(isConnected);
          setAccounts(acc);
          setTransactions(tx);
          setLastUpdated(payload.last_updated || new Date().toISOString());
          setError(null);

          setSyncDetails(
            `end_user_id=${eu} | fiskil accounts=${acc.length} (status ${aStatus}) | transactions=${tx.length} (status ${tStatus}) | last_updated=${payload.last_updated || "null"}`
          );
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load bank data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const startPolling = async () => {
      setLoading(true);
      setError(null);

      const session = (await supabase.auth.getSession()).data.session;
      const jwt = session?.access_token;

      if (!jwt) {
        if (!cancelled) {
          setConnected(false);
          setAccounts([]);
          setTransactions([]);
          setError("Please log in to view your bank data.");
          setLoading(false);
        }
        return;
      }

      // Immediate fetch
      await fetchOnce(jwt);

      // If we already have tx, stop.
      if (transactions.length > 0) {
        stopPolling();
        return;
      }

      // Poll for max 90 seconds, every 4s
      if (pollTimerRef.current) return;
      pollStartRef.current = Date.now();

      pollTimerRef.current = window.setInterval(async () => {
        if (cancelled) return;

        const elapsed = Date.now() - pollStartRef.current;
        if (elapsed > 90_000) {
          stopPolling();
          if (!cancelled) {
            setError("Bank data is taking too long. Please try again in 1–2 minutes.");
          }
          return;
        }

        const s = (await supabase.auth.getSession()).data.session;
        const jwt2 = s?.access_token;
        if (!jwt2) return;

        await fetchOnce(jwt2);

        // Stop once we have transactions
        if (!cancelled && (transactions.length > 0)) {
          stopPolling();
        }
      }, 4000);
    };

    void startPolling();

    return () => {
      cancelled = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityKey]);

  return {
    accounts,
    transactions,
    loading,
    error,
    mode: "live",
    lastUpdated,

    syncing: derived.syncing,
    syncProgress: clamp(derived.p, 0, 100),
    syncMessage: derived.msg,
    syncDetails,
  };
}
