// 🚀 Optimized useFiskilData.ts — fast + cached + ready for AI insights
import { useEffect, useRef, useState } from "react";
import { Account, AccountType, Transaction } from "../types";

const ACCOUNT_TYPE_VALUES = new Set(Object.values(AccountType));

const parseAmount = (value: any): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, " ");
    const matches = cleaned.match(/-?\d+(?:\.\d+)?/g);
    if (matches && matches.length > 0) {
      const parsed = parseFloat(matches[0]);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  if (value && typeof value === "object") {
    if (value.current !== undefined) return parseAmount(value.current);
    if (value.available !== undefined) return parseAmount(value.available);
    if (value.amount !== undefined) return parseAmount(value.amount);
    if (value.value !== undefined) return parseAmount(value.value);
    if (value.balance !== undefined) return parseAmount(value.balance);
  }
  return 0;
};

const mapAccountType = (rawType: any, name: string): AccountType => {
  if (ACCOUNT_TYPE_VALUES.has(rawType as AccountType)) {
    return rawType as AccountType;
  }
  const source = `${rawType || name}`.toLowerCase();
  if (source.includes("savings")) return AccountType.SAVINGS;
  if (source.includes("credit")) return AccountType.CREDIT_CARD;
  if (source.includes("loan") || source.includes("mortgage")) return AccountType.LOAN;
  return AccountType.CHECKING;
};

const normalizeAccount = (raw: any): Account => {
  if (!raw || typeof raw !== "object") {
    return {
      id: `acc-${Math.random().toString(36).slice(2)}`,
      name: "Account",
      type: AccountType.CHECKING,
      balance: 0,
      currency: "AUD",
    };
  }

  const name = (raw.name || raw.accountName || raw.displayName || raw.productName || "Account").toString().trim();
  const type = mapAccountType(raw.type?.text || raw.type?.code || raw.type || raw.accountType || raw.productType, name);
  const balanceSource =
    raw.balance?.current ??
    raw.balance?.available ??
    raw.balance ??
    raw.currentBalance ??
    raw.availableBalance ??
    raw.amount ??
    raw.openingBalance ??
    0;
  let balance = parseAmount(balanceSource);
  if ((type === AccountType.CREDIT_CARD || type === AccountType.LOAN) && balance > 0) {
    balance = -Math.abs(balance);
  }
  if (raw.balance?.current < 0 || raw.currentBalance < 0) {
    balance = parseAmount(raw.balance?.current ?? raw.currentBalance);
  }

  const currency =
    raw.balance?.currencyCode ||
    raw.balance?.currency ||
    raw.currencyCode ||
    raw.currency ||
    "AUD";

  return {
    id: String(raw.id || raw.accountId || raw.number || `acc-${Math.random().toString(36).slice(2)}`),
    name: name || "Account",
    type,
    balance,
    currency,
  };
};

const parseDateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 10 ** 12 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && trimmed.replace(/\D/g, "").length >= 8) {
      const ms = trimmed.length <= 10 ? numeric * 1000 : numeric;
      const numericDate = new Date(ms);
      if (!Number.isNaN(numericDate.getTime())) return numericDate;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const normalizeTransaction = (raw: any): Transaction => {
  if (!raw || typeof raw !== "object") {
    const fallbackDate = new Date().toISOString();
    return {
      id: `txn-${Math.random().toString(36).slice(2)}`,
      accountId: "unknown-account",
      description: "Transaction",
      amount: 0,
      date: fallbackDate,
      category: "Other",
    };
  }

  const description = (raw.description || raw.narration || raw.merchant?.name || "Transaction").toString().trim() || "Transaction";
  const amountSource = raw.amount ?? raw.amount?.value ?? raw.amount?.current ?? raw.amount?.amount ?? raw.transactionAmount;
  const amount = parseAmount(amountSource);
  const dateCandidates = [
    raw.date,
    raw.postDate,
    raw.transactionDate,
    raw.valueDate,
    raw.postedAt,
    raw.updatedAt,
    raw.createdAt,
  ];
  let isoDate: string | null = null;
  for (const candidate of dateCandidates) {
    const parsed = parseDateValue(candidate);
    if (parsed) {
      isoDate = parsed.toISOString();
      break;
    }
  }
  if (!isoDate) {
    isoDate = new Date().toISOString();
  }

  const categorySource = raw.category?.text || raw.category?.name || raw.category || raw.class || raw.subcategory || "Other";

  return {
    id: String(raw.id || raw.transactionId || `${description}-${isoDate}`),
    accountId: String(raw.accountId || raw.account?.id || raw.account || "unknown-account"),
    description,
    amount,
    date: isoDate,
    category: categorySource ? String(categorySource) : "Other",
  };
};

interface FiskilData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;
}

export function useFiskilData(identityKey?: string): FiskilData {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    const storedId =
      localStorage.getItem("fiskilCustomerId") || localStorage.getItem("fiskilPendingCustomerId") || "";
    const fiskilCustomerId = storedId;
    const params = new URLSearchParams(window.location.search);
    const jobIdParam = params.get("jobId") || params.get("jobIds");
    let jobId = jobIdParam ? jobIdParam.trim() : "";
    const connectionError = params.get("error");

    const removeQueryParams = (keys: string[]) => {
      keys.forEach((key) => params.delete(key));
      const query = params.toString();
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState({}, "", nextUrl);
    };

    if (connectionError) {
      const decoded = decodeURIComponent(connectionError);
      setError(`Bank connection failed: ${decoded}`);
      setLoading(false);
      removeQueryParams(["error"]);
      return;
    }

    if (!fiskilCustomerId) {
      setAccounts([]);
      setTransactions([]);
      setLoading(false);
      setError("No connected bank account yet.");
      hasDataRef.current = false;
      return;
    }

    // 🔹 Try cached data immediately
    const cachedAccounts = localStorage.getItem("accountsCache");
    const cachedTransactions = localStorage.getItem("transactionsCache");
    const cachedTime = localStorage.getItem("fiskilCacheTime");
    if (cachedAccounts && cachedTransactions) {
      try {
        const parsedAccounts = JSON.parse(cachedAccounts);
        const parsedTransactions = JSON.parse(cachedTransactions);
        const normalisedAccounts = Array.isArray(parsedAccounts)
          ? parsedAccounts.map(normalizeAccount)
          : [];
        const normalisedTransactions = Array.isArray(parsedTransactions)
          ? parsedTransactions.map(normalizeTransaction)
          : [];
        setAccounts(normalisedAccounts);
        setTransactions(normalisedTransactions);
        setLastUpdated(cachedTime || null);
        setLoading(false);
        hasDataRef.current = normalisedAccounts.length > 0 || normalisedTransactions.length > 0;
      } catch {
        console.warn("⚠️ Cache parse failed, fetching fresh data");
      }
    }

    const fetchData = async () => {
      try {
        const query = new URLSearchParams({ userId: fiskilCustomerId });
        if (jobId) {
          query.set("jobId", jobId);
        }

        const res = await fetch(`/api/fiskil-data?${query.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();

        const acc = Array.isArray(data.accounts) ? data.accounts : [];
        const tx = Array.isArray(data.transactions) ? data.transactions : [];
        const normalisedAccounts = acc.map(normalizeAccount);
        const normalisedTransactions = tx.map(normalizeTransaction);

        setAccounts(normalisedAccounts);
        setTransactions(normalisedTransactions);
        setError(null);
        setLastUpdated(new Date().toISOString());
        hasDataRef.current =
          normalisedAccounts.length > 0 || normalisedTransactions.length > 0 || hasDataRef.current;

        // 🔹 Save to cache for next load
        localStorage.setItem("accountsCache", JSON.stringify(normalisedAccounts));
        localStorage.setItem("transactionsCache", JSON.stringify(normalisedTransactions));
        localStorage.setItem("fiskilCacheTime", new Date().toISOString());

        if (jobId) {
          try {
            localStorage.setItem("fiskilConnectionStatus", "success");
            const pendingId = localStorage.getItem("fiskilPendingCustomerId");
            if (pendingId) {
              localStorage.setItem("fiskilCustomerId", pendingId);
              localStorage.removeItem("fiskilPendingCustomerId");
            }
          } catch (storageErr) {
            console.warn("Unable to finalise Fiskil connection state", storageErr);
          }
          removeQueryParams(["jobId", "jobIds"]);
          jobId = "";
        }
      } catch (err: any) {
        console.error("❌ Failed to load Fiskil data:", err);
        if (hasDataRef.current) {
          setError("We're retrying your bank sync. Showing last saved balances while we reconnect.");
        } else {
          setError(err?.message || "Failed to load data");
        }
        if (jobId) {
          try {
            localStorage.setItem("fiskilConnectionStatus", "error");
          } catch (storageErr) {
            console.warn("Unable to persist connection error", storageErr);
          }
          jobId = "";
          removeQueryParams(["jobId", "jobIds"]);
        }
      } finally {
        setLoading(false);
      }
    };

    // 🔹 Fetch fresh in background
    fetchData();

    // 🔁 Optional periodic refresh (every 5 min)
    const id = setInterval(fetchData, 300_000);
    return () => clearInterval(id);
  }, [identityKey]);

  return { accounts, transactions, loading, error, mode: "live", lastUpdated };
}
