// 🚀 REPLACEMENT FOR: /src/hooks/useBasiqData.ts
// Live-only hook. Optional jobId support via location.search. No demo.

import { useEffect, useState } from "react";
import { Account, Transaction } from "../types";

interface BasiqData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
}

export function useBasiqData(userId?: string): BasiqData {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode] = useState<"live">("live");

  useEffect(() => {
    const storedId = localStorage.getItem("basiqUserId") || "";
    const basiqUserId = userId || storedId;

    // pick up jobId from redirect query params if present
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("jobId") || "";

    if (!basiqUserId) {
      setAccounts([]);
      setTransactions([]);
      setError("No connected bank account yet.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ userId: basiqUserId });
        if (jobId) qs.set("jobId", jobId);
        const res = await fetch(`/api/basiq-data?${qs.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
        const data = await res.json();
        setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load banking data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // periodic refresh (optional)
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [userId]);

  return { accounts, transactions, loading, error, mode };
}