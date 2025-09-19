import React, { useMemo } from "react";
import Card from "./Card";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from "recharts";
import { Transaction } from "../types";
import { format } from "date-fns";

interface CashflowMiniProps {
  transactions: Transaction[];
}

export default function CashflowMini({ transactions }: CashflowMiniProps) {
  // Group transactions by month, sum income vs expenses
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const monthlyTotals: Record<string, { in: number; out: number }> = {};

    transactions.forEach((txn) => {
      const month = format(new Date(txn.date), "MMM"); // e.g. "Jan"
      if (!monthlyTotals[month]) monthlyTotals[month] = { in: 0, out: 0 };

      if (txn.amount > 0) {
        monthlyTotals[month].in += txn.amount;
      } else {
        monthlyTotals[month].out += Math.abs(txn.amount);
      }
    });

    return Object.entries(monthlyTotals).map(([m, { in: incoming, out }]) => ({
      m,
      in: incoming,
      out,
    }));
  }, [transactions]);

  return (
    <Card title="Cashflow (Monthly)">
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.35} />
                <stop offset="95%" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.25} />
                <stop offset="95%" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="in" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#inG)" />
            <Area type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#outG)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
