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

const buildProjection = (
  monthlyNet: ReturnType<typeof buildMonthlyNet>,
  startingBalance: number
): ProjectionPoint[] => {
  if (monthlyNet.length === 0) return [];
  const recent = monthlyNet.slice(-3);
  const savingsPerMonth = Math.round(
    recent.reduce((total, item) => total + item.net, 0) / Math.max(recent.length, 1)
  );
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
    if (monthlyNet.length === 0) {
      return { currentNet: 0, previousNet: null as number | null };
    }
    const current = monthlyNet[monthlyNet.length - 1]?.net ?? 0;
    const previous = monthlyNet.length > 1 ? monthlyNet[monthlyNet.length - 2]?.net ?? 0 : null;
    return { currentNet: current, previousNet: previous };
  }, [monthlyNet]);

  if (projection.length === 0) {
    return (
      <Card title="Account forecast">
        <p className="text-sm text-white/70">Connect your accounts and build a month of history to model six months ahead.</p>
      </Card>
    );
  }

  const sixMonthTotal = projection[projection.length - 1]?.projected ?? startingBalance;
  const maxProjected = Math.max(
    ...projection.map((point) => Math.max(0, point.projected)),
    Math.max(0, startingBalance)
  );

  return (
    <Card title="Account forecast">
      <div className="space-y-3">
        <p className="text-sm text-white/70">
          We start from your current cash balance and layer on your average monthly net. At this pace you add{" "}
          {formatCurrency(savingsPerMonth, region, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })} per month.
        </p>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">Last month&apos;s net</span>
          <MonthlyDelta
            currentValue={currentNet}
            previousValue={previousNet}
            formatter={(value) =>
              formatCurrency(value, region, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            }
            valueClassName="text-lg font-semibold text-white"
            deltaClassName="text-[0.65rem]"
            className="items-end text-right"
          />
        </div>
      </div>
      <div className="mt-5">
        <div className="flex h-28 items-end gap-2 rounded-2xl bg-black/40 px-4 py-4">
          {projection.map((point, index) => {
            const safeProjected = Math.max(0, point.projected);
            const height = maxProjected ? Math.max(10, (safeProjected / maxProjected) * 100) : 0;
            return (
              <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="forecast-bar w-full rounded-full bg-[#1F0051]"
                  style={{ height: `${height}%`, animationDelay: `${index * 0.1}s` }}
                />
                <span className="text-[0.6rem] uppercase tracking-[0.3em] text-white/50">{point.month}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
        If you keep this cadence, your cash balance could reach{" "}
        {formatCurrency(sixMonthTotal, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} in six months.
      </p>
    </Card>
  );
};

export default SpendingForecast;
