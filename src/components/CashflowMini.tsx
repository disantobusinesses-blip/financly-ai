import { useMemo } from "react";
import Card from "./Card";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from "recharts";
import { Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

interface CashflowMiniProps {
  transactions: Transaction[];
}

export default function CashflowMini({ transactions }: CashflowMiniProps) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const { chartData, totals } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        chartData: [] as { m: string; income: number; expenses: number; net: number }[],
        totals: { income: 0, expenses: 0, net: 0 },
      };
    }

    const monthlyTotals: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach((txn) => {
      const date = new Date(txn.date);
      const month = Number.isNaN(date.getTime())
        ? "Pending"
        : date.toLocaleString("default", { month: "short" });
      if (!monthlyTotals[month]) monthlyTotals[month] = { income: 0, expenses: 0 };

      if (txn.amount > 0) {
        monthlyTotals[month].income += txn.amount;
      } else {
        monthlyTotals[month].expenses += Math.abs(txn.amount);
      }
    });

    const chartData = Object.entries(monthlyTotals).map(
      ([m, { income, expenses }]) => ({
        m,
        income,
        expenses,
        net: income - expenses,
      })
    );

    const totals = chartData.reduce(
      (acc, item) => {
        acc.income += item.income;
        acc.expenses += item.expenses;
        acc.net += item.net;
        return acc;
      },
      { income: 0, expenses: 0, net: 0 }
    );

    return { chartData, totals };
  }, [transactions]);

  return (
    <Card
      title="Cashflow (Monthly)"
      subtitle="Track how much you kept after bills and spending each month."
      insights={[
        {
          label: "Income",
          value: formatCurrency(totals.income, region),
          tone: "positive",
        },
        {
          label: "Expenses",
          value: formatCurrency(totals.expenses, region),
          tone: "negative",
        },
        {
          label: "Net",
          value: formatCurrency(totals.net, region),
          tone: totals.net >= 0 ? "positive" : "negative",
        },
      ]}
    >
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
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
            <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value: number, name: string) => {
                const label = name === "income" ? "Income" : name === "expenses" ? "Expenses" : "Net";
                return [formatCurrency(value, region), label];
              }}
            />
            <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#inG)" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#outG)" />
            <Area type="monotone" dataKey="net" stroke="#38bdf8" strokeWidth={2} fillOpacity={0} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
