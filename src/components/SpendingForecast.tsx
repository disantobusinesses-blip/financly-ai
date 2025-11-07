import React, { useMemo } from "react";
import { Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import Card from "./Card";
import MonthlyDelta from "./MonthlyDelta";

interface SpendingForecastProps {
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

const buildProjection = (monthlyNet: ReturnType<typeof buildMonthlyNet>): ProjectionPoint[] => {
  if (monthlyNet.length === 0) return [];
  const recent = monthlyNet.slice(-3);
  const savingsPerMonth = Math.max(
    0,
    Math.round(
      recent.reduce((total, item) => total + item.net, 0) / Math.max(recent.length, 1)
    )
  );
  const now = new Date();

  return Array.from({ length: 6 }).map((_, index) => {
    const future = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
    const label = future.toLocaleString(undefined, { month: "short", year: "numeric" });
    const projected = savingsPerMonth * (index + 1);
    return { month: label, projected };
  });
};

const SpendingForecast: React.FC<SpendingForecastProps> = ({ transactions, region }) => {
  const monthlyNet = useMemo(() => buildMonthlyNet(transactions), [transactions]);
  const projection = useMemo(() => buildProjection(monthlyNet), [monthlyNet]);
  const savingsPerMonth = useMemo(() => {
    if (monthlyNet.length === 0) return 0;
    const recent = monthlyNet.slice(-3);
    return Math.max(
      0,
      Math.round(
        recent.reduce((total, item) => total + item.net, 0) / Math.max(recent.length, 1)
      )
    );
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
      <Card title="Spending forecast">
        <p className="text-sm text-white/70">Connect your accounts and build a month of history to model six months ahead.</p>
      </Card>
    );
  }

  const sixMonthTotal = projection[projection.length - 1]?.projected ?? 0;

  return (
    <Card title="Spending forecast">
      <div className="space-y-3">
        <p className="text-sm text-white/70">
          We analyse the last three months of net cashflow. At your current pace you&apos;re saving {formatCurrency(savingsPerMonth, region, {
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
      <div className="mt-5 space-y-3">
        {projection.map((point) => (
          <div
            key={point.month}
            className="flex items-center justify-between rounded-2xl bg-black/40 px-4 py-3 text-sm text-white/80"
          >
            <span className="uppercase tracking-[0.3em] text-white/60">{point.month}</span>
            <span className="text-lg font-semibold text-primary-light">
              {formatCurrency(point.projected, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
        Stay consistent and you&apos;ll bank about {formatCurrency(sixMonthTotal, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} over the next six months. Increase monthly savings to accelerate this curve.
      </p>
    </Card>
  );
};

export default SpendingForecast;
