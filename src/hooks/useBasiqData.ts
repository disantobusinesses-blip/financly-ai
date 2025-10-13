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
        const res = await fetch(
          `/api/basiq-data?userId=${encodeURIComponent(basiqUserId)}`,
          { cache: "no-store" }
        );
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
      } catch (err: any) {
        console.error("❌ Failed to load Basiq data:", err);
        setError(err.message || "Failed to load data");
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