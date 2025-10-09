import { useEffect, useState } from "react";
import { Account, Transaction } from "../types";

interface BasiqData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live"; // ✅ no demo fallback
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

    // ✅ Reset when there is no connected bank yet
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
        const url = `/api/basiq-data?userId=${encodeURIComponent(basiqUserId)}`;
        console.info("📡 Fetching Basiq data from:", url);

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`API error ${res.status}`);

        const data = await res.json();

        if (!data.accounts || !Array.isArray(data.accounts)) {
          throw new Error("Malformed response: accounts missing or invalid.");
        }

        setAccounts(data.accounts);
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } catch (err: any) {
        console.error("❌ Failed to load Basiq data:", err);
        setError(err.message || "Failed to load banking data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // ✅ Refetch when user reconnects
    const interval = setInterval(fetchData, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [userId]);

  return { accounts, transactions, loading, error, mode };
}
