// 🚀 Optimized useBasiqData.ts — fast + cached + parallel Gemini ready
import { useEffect, useState } from "react";
import { Account, Transaction } from "../types";

interface BasiqData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;
}

export function useBasiqData(userId?: string): BasiqData {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("basiqUserId") || "";
    const basiqUserId = userId || storedId;
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

    if (!basiqUserId) {
      setAccounts([]);
      setTransactions([]);
      setLoading(false);
      setError("No connected bank account yet.");
      return;
    }

    // 🔹 Try cached data immediately
    const cachedAccounts = localStorage.getItem("accountsCache");
    const cachedTransactions = localStorage.getItem("transactionsCache");
    const cachedTime = localStorage.getItem("basiqCacheTime");
    if (cachedAccounts && cachedTransactions) {
      try {
        setAccounts(JSON.parse(cachedAccounts));
        setTransactions(JSON.parse(cachedTransactions));
        setLastUpdated(cachedTime || null);
        setLoading(false);
      } catch {
        console.warn("⚠️ Cache parse failed, fetching fresh data");
      }
    }

    const fetchData = async () => {
      try {
        const query = new URLSearchParams({ userId: basiqUserId });
        if (jobId) {
          query.set("jobId", jobId);
        }

        const res = await fetch(`/api/basiq-data?${query.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();

        const acc = Array.isArray(data.accounts) ? data.accounts : [];
        const tx = Array.isArray(data.transactions) ? data.transactions : [];

        setAccounts(acc);
        setTransactions(tx);
        setError(null);
        setLastUpdated(new Date().toISOString());

        // 🔹 Save to cache for next load
        localStorage.setItem("accountsCache", JSON.stringify(acc));
        localStorage.setItem("transactionsCache", JSON.stringify(tx));
        localStorage.setItem("basiqCacheTime", new Date().toISOString());

        if (jobId) {
          try {
            localStorage.setItem("basiqConnectionStatus", "success");
            const pendingId = localStorage.getItem("basiqPendingUserId");
            if (pendingId) {
              localStorage.setItem("basiqUserId", pendingId);
              localStorage.removeItem("basiqPendingUserId");
            }
          } catch (storageErr) {
            console.warn("Unable to finalise Basiq connection state", storageErr);
          }
          removeQueryParams(["jobId", "jobIds"]);
          jobId = "";
        }
      } catch (err: any) {
        console.error("❌ Failed to load Basiq data:", err);
        setError(err.message || "Failed to load data");
        if (jobId) {
          try {
            localStorage.setItem("basiqConnectionStatus", "error");
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
  }, [userId]);

  return { accounts, transactions, loading, error, mode: "live", lastUpdated };
}