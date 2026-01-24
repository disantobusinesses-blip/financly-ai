import React, { useEffect, useMemo, useState } from "react";
import type { FinancialAnalysisRequest, FinancialAnalysisResponse, WeeklyOrder } from "../services/AIService";
import { fetchFinancialAnalysis } from "../services/AIService";
import type { Account, Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";

type Props = {
  userId: string;
  region: User["region"];
  transactions: Transaction[];
  accounts: Account[];
  totalBalance: number;
};

const getPeriod = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const WeeklyOrdersPanel: React.FC<Props> = ({ userId, region, transactions, accounts, totalBalance }) => {
  const [orders, setOrders] = useState<WeeklyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const payload: FinancialAnalysisRequest = useMemo(() => {
    const { month, year } = getPeriod();
    return {
      userId,
      month,
      year,
      region,
      transactions,
      accounts,
      totalBalance,
      forceRefresh: false,
    };
  }, [userId, region, transactions, accounts, totalBalance]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!transactions?.length) {
        setOrders([]);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const res: FinancialAnalysisResponse = await fetchFinancialAnalysis(payload);
        if (!mounted) return;
        setOrders(Array.isArray(res.analysis.weeklyOrders) ? res.analysis.weeklyOrders : []);
      } catch (e) {
        if (!mounted) return;
        setErr(e instanceof Error ? e.message : "Unable to load weekly orders.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [payload, transactions?.length]);

  const openPage = () => {
    window.history.pushState({}, "", "/app/weekly-orders");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">AI Operator</p>
          <h2 className="mt-2 text-xl font-semibold text-white">This week’s orders</h2>
          <p className="mt-1 text-sm text-white/60">
            Ranked actions based on your last 30 days. Do these and you’ll improve fast.
          </p>
        </div>
        <button
          type="button"
          onClick={openPage}
          className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/25 hover:bg-black/55"
        >
          Open →
        </button>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">Generating orders…</div>
      ) : err ? (
        <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{err}</div>
      ) : orders.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
          No orders yet. Refresh your data or connect a bank.
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {orders.slice(0, 3).map((o, idx) => (
            <div key={`${o.title}-${idx}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/70">Order {idx + 1}</p>
                  <p className="mt-1 text-base font-semibold text-white">{o.title}</p>
                  {o.why ? <p className="mt-2 text-sm text-white/60">{o.why}</p> : null}
                </div>

                <div className="shrink-0 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Impact</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(o.impactMonthly, region)}/mo</p>
                </div>
              </div>

              {o.steps?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
                  {o.steps.slice(0, 4).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-white/40">This is not financial advice.</p>
    </section>
  );
};

export default WeeklyOrdersPanel;
