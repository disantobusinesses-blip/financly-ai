import { useEffect, useState } from "react";

export function useBasiqData(userId: string) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    fetch(`/api/basiq-data?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
      })
      .catch((err) => {
        console.error("❌ Failed to load Basiq data", err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return { accounts, transactions, loading };
}
