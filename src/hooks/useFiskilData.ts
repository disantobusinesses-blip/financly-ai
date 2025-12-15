// src/hooks/useFiskilData.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Account, AccountType, Transaction } from "../types";

const ACCOUNT_TYPE_VALUES = new Set(Object.values(AccountType));

const parseAmount = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const matches = value.replace(/,/g, " ").match(/-?\d+(?:\.\d+)?/);
    if (matches?.[0]) {
      const parsed = Number(matches[0]);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }
  if (value && typeof value === "object") {
    const v = value as any;
    if (v.current !== undefined) return parseAmount(v.current);
    if (v.available !== undefined) return parseAmount(v.available);
    if (v.amount !== undefined) return parseAmount(v.amount);
    if (v.value !== undefined) return parseAmount(v.value);
    if (v.balance !== undefined) return parseAmount(v.balance);
  }
  return 0;
};

const mapAccountType = (rawType: unknown, name: string): AccountType => {
  if (ACCOUNT_TYPE_VALUES.has(rawType as AccountType)) return rawType as AccountType;
  const source = `${rawType || name}`.toLowerCase();
  if (source.includes("savings")) return AccountType.SAVINGS;
  if (source.includes("credit")) return AccountType.CREDIT_CARD;
  if (source.includes("loan") || source.includes("mortgage")) return AccountType.LOAN;
  return AccountType.CHECKING;
};

const normalizeAccount = (raw: any): Account => {
  const name = (raw?.name || raw?.accountName || raw?.displayName || raw?.productName || "Account").toString().trim();
  const type = mapAccountType(raw?.type?.text || raw?.type?.code || raw?.type || raw?.accountType || raw?.productType, name);

  const balanceSource =
    raw?.balance?.current ??
    raw?.balance?.available ??
    raw?.balance ??
    raw?.currentBalance ??
    raw?.availableBalance ??
    raw?.amount ??
    raw?.openingBalance ??
    0;

  let balance = parseAmount(balanceSource);

  if ((type === AccountType.CREDIT_CARD || type === AccountType.LOAN) && balance > 0) {
    balance = -Math.abs(balance);
  }

  const currency =
    raw?.balance?.currencyCode ||
    raw?.balance?.currency ||
    raw?.currencyCode ||
    raw?.currency ||
    "AUD";

  return {
    id: String(raw?.id || raw?.accountId || raw?.number || `acc-${Math.random().toString(36).slice(2)}`),
    name: name || "Account",
    type,
    balance,
    currency,
  };
};

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 10 ** 12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
};

const normalizeTransaction = (raw: any): Transaction => {
  const description =
    (raw?.description || raw?.narration || raw?.merchant?.name || "Transaction").toString().trim() || "Transaction";

  const amountSource =
    raw?.amount ?? raw?.amount?.value ?? raw?.amount?.current ?? raw?.amount?.amount ?? raw?.transactionAmount;

  const amount = parseAmount(amountSource);

  const dateCandidates = [
    raw?.date,
    raw?.postDate,
    raw?.transactionDate,
    raw?.valueDate,
    raw?.postedAt,
    raw?.updatedAt,
    raw?.createdAt,
  ];

  let isoDate: string | null = null;
  for (const c of dateCandidates) {
    const parsed = parseDateValue(c);
    if (parsed) {
      isoDate = parsed.toISOString();
      break;
    }
  }
  if (!isoDate) isoDate = new Date().toISOString();

  const categorySource = raw?.category?.text || raw?.category?.name || raw?.category || raw?.class || raw?.subcategory || "Other";

  return {
    id: String(raw?.id || raw?.transactionId || `${description}-${isoDate}`),
    accountId: String(raw?.account_id || raw?.accountId || raw?.account?.id || raw?.account || "unknown-account"),
    description,
    amount,
    date: isoDate,
    category: String(categorySource || "Other"),
  };
};

export interface FiskilDataResult {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;
}

export function useFiskilData(identityKey?: string): FiskilDataResult {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    const loadFromCache = () => {
      const cachedAccounts = localStorage.getItem("accountsCache");
      const cachedTransactions = localStorage.getItem("transactionsCache");
      const cachedTime = localStorage.getItem("fiskilCacheTime");
      if (!cachedAccounts || !cachedTransactions) return;

      try {
        const acc = JSON.parse(cachedAccounts);
        const tx = JSON.parse(cachedTransactions);

        const normalisedAccounts = Array.isArray(acc) ? acc.map(normalizeAccount) : [];
        const normalisedTransactions = Array.isArray(tx) ? tx.map(normalizeTransaction) : [];

        setAccounts(normalisedAccounts);
        setTransactions(normalisedTransactions);
        setLastUpdated(cachedTime || null);
        setLoading(false);
        hasDataRef.current = normalisedAccounts.length > 0 || normalisedTransactions.length > 0;
      } catch {
        // ignore cache errors
      }
    };

    const fetchData = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          setAccounts([]);
          setTransactions([]);
          setError("Please log in to view your bank data.");
          setLoading(false);
          hasDataRef.current = false;
          return;
        }

        const res = await fetch("/api/fiskil-data", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        const payload = text ? JSON.parse(text) : {};

        if (!res.ok) {
          const msg = payload?.error || payload?.details || `API error ${res.status}`;
          if (String(msg).toLowerCase().includes("no connected bank")) {
            setAccounts([]);
            setTransactions([]);
            setError("No connected bank account yet.");
            setLoading(false);
            hasDataRef.current = false;
            return;
          }
          throw new Error(msg);
        }

        const normalisedAccounts = (Array.isArray(payload.accounts) ? payload.accounts : []).map(normalizeAccount);
        const normalisedTransactions = (Array.isArray(payload.transactions) ? payload.transactions : []).map(normalizeTransaction);

        setAccounts(normalisedAccounts);
        setTransactions(normalisedTransactions);
        setError(null);

        const nowIso = new Date().toISOString();
        setLastUpdated(nowIso);

        hasDataRef.current = normalisedAccounts.length > 0 || normalisedTransactions.length > 0 || hasDataRef.current;

        localStorage.setItem("accountsCache", JSON.stringify(normalisedAccounts));
        localStorage.setItem("transactionsCache", JSON.stringify(normalisedTransactions));
        localStorage.setItem("fiskilCacheTime", nowIso);
      } catch (err: any) {
        if (hasDataRef.current) {
          setError("We’re retrying your bank sync. Showing last saved balances while we reconnect.");
        } else {
          setError(err?.message || "Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };

    loadFromCache();
    fetchData();

    const intervalId = setInterval(fetchData, 300_000);
    return () => clearInterval(intervalId);
  }, [identityKey]);

  return { accounts, transactions, loading, error, mode: "live", lastUpdated };
}
