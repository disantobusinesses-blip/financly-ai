import React, { useMemo } from "react";
import { Account, Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import { computeAccountOverview } from "../utils/metrics";
import Card from "./Card";
import MonthlyDelta from "./MonthlyDelta";

interface SpendingForecastProps {
  accounts: Account[];
  transactions: Transaction[];
  region: User["region"];
}

interface ProjectionPoint {
  month: string;
  projected: number;
}

const buildMonthlyNet = (transactions: Transaction[]) => {
  const totals = new Map<string, { date: Date; net: number }>();
  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const existing = totals.get(key) ?? { date: new Date(date.getFullYear(), date.getMonth(), 1), net: 0 };
    existing.net += transaction.amount;
    totals.set(key, existing);
  });
  return Array.from(totals.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
};

const buildProjection = (monthlyNet: ReturnType<typeof buildMonthlyNet>, startingBalance: number): ProjectionPoint[] => {
  if (monthlyNet.length === 0) return [];
  const recent = monthlyNet.slice(-3);
  const savingsPerMonth = Math.round(recent.reduce((total, item) => total + item.net, 0) / Math.max(recent.length, 1));
  const now = new Date();

  return Array.from({ length: 6 }).map((_, index) => {
    const future = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
    const label = future.toLocaleString(undefined, { month: "short", year: "numeric" });
    const projected = startingBalance + savingsPerMonth * (index + 1);
    return { month: label, projected };
  });
};

const SpendingForecast: React.FC<SpendingForecastProps> = ({ accounts, transactions, region }) => {
  const monthlyNet = useMemo(() => buildMonthlyNet(transactions), [transactions]);
  const overview = useMemo(() => computeAccountOverview(accounts), [accounts]);
  const startingBalance = overview.spendingAvailable;

  const projection = useMemo(() => buildProjection(monthlyNet, startingBalance), [monthlyNet, startingBalance]);

  const savingsPerMonth = useMemo(() => {
    if (monthlyNet.length === 0) return 0;
    const recent = monthlyNet.slice(-3);
    return Math.round(recent.reduce((total, item) => total + item.net, 0) / Math.max(recent.length, 1));
  }, [monthlyNet]);

  const { currentNet, previousNet } = useMemo(() => {
    if (monthlyNet.length === 0) return { currentNet: 0, previousNet: null as number | null };
    const current = monthlyNet[monthlyNet.length - 1]?.net ?? 0;
    const previous = monthlyNet.length > 1 ? monthlyNet[monthlyNet.length - 2]?.net ?? 0 : null;
    return { currentNet: current, previousNet: previous };
  }, [monthlyNet]);

  if (projection.length === 0) {
    return (
      <Card title="Account forecast">
        <p className="text-sm text-white/70">Connect accounts and build history to model future cashflow.</p>
      </Card>
    );
  }

  const values = projection.map((p) => Math.max(0, p.projected));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  const w = 560;
  const h = 160;
  const padX = 18;
  const padY = 18;

  const xFor = (i: number) => padX + (i * (w - padX * 2)) / (projection.length - 1);
  const yFor = (v: number) => {
    const range = Math.max(1, maxV - minV);
    const t = (v - minV) / range;
    return h - padY - t * (h - padY * 2);
  };

  const path = projection
    .map((p, i) => {
      const x = xFor(i);
      const y = yFor(Math.max(0, p.projected));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const last = projection[projection.length - 1]?.projected ?? startingBalance;

  return (
    <Card title="Account forecast">
      <div className="space-y-3">
        <p className="text-sm text-white/70">
          Based on your last 3 months, your average net is{" "}
          <span className="text-white font-semibold">
            {formatCurrency(savingsPerMonth, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>{" "}
          per month.
        </p>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">Last month&apos;s net</span>
          <MonthlyDelta
            currentValue={currentNet}
            previousValue={previousNet}
            formatter={(value) =>
              formatCurrency(value, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            }
            valueClassName="text-lg font-semibold text-white"
            deltaClassName="text-[0.65rem]"
            className="items-end text-right"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
          <defs>
            <linearGradient id="forecastLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7C3AED" stopOpacity="0.9" />
              <stop offset="1" stopColor="#22C55E" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          <path d={path} fill="none" stroke="url(#forecastLine)" strokeWidth="4" strokeLinecap="round" />
        </svg>

        <div className="mt-3 flex justify-between text-[0.65rem] uppercase tracking-[0.25em] text-white/50">
          {projection.map((p) => (
            <span key={p.month}>{p.month.split(" ")[0]}</span>
          ))}
        </div>
      </div>

      <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
        At this pace, cash balance could reach{" "}
        <span className="font-semibold text-white">
          {formatCurrency(last, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>{" "}
        in ~6 months.
      </p>
    </Card>
  );
};

export default SpendingForecast;
