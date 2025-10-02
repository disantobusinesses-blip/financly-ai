import { useEffect, useState } from "react";
import { Account, Transaction } from "../types";

interface BasiqData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live"; // ✅ no demo mode
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

    // If no userId yet → blank state
    if (!basiqUserId) {
      setAccounts([]);
      setTransactions([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `/api/basiq-data?userId=${encodeURIComponent(basiqUserId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error ${res.status}`);

        const data = await res.json();

        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
      } catch (err: any) {
        console.error("❌ Failed to load Basiq data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { accounts, transactions, loading, error, mode };
}
