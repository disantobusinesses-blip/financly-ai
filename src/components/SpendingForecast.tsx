import React, { useMemo, useState } from "react";
import { Account, Transaction, User } from "../types";
import { formatCurrency } from "../utils/currency";
import { computeAccountOverview } from "../utils/metrics";
import Card from "./Card";

interface SpendingForecastProps {
  accounts: Account[];
  transactions: Transaction[];
  region: User["region"];
  monthsBack?: number; // how many past months to show (default 6)
}

type MonthNet = { date: Date; label: string; net: number };

type Point = {
  label: string;
  value: number;
  kind: "actual" | "forecast";
};

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

const buildMonthlyNet = (transactions: Transaction[]): MonthNet[] => {
  const totals = new Map<string, { date: Date; net: number }>();

  for (const t of transactions) {
    const date = new Date(t.date);
    if (Number.isNaN(date.getTime())) continue;

    const key = monthKey(date);
    const bucket =
      totals.get(key) ?? { date: new Date(date.getFullYear(), date.getMonth(), 1), net: 0 };

    bucket.net += t.amount;
    totals.set(key, bucket);
  }

  const arr = Array.from(totals.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  return arr.map((m) => ({
    ...m,
    label: m.date.toLocaleString(undefined, { month: "short" }),
  }));
};

const avgRecentNet = (monthly: MonthNet[], n: number) => {
  if (monthly.length === 0) return 0;
  const recent = monthly.slice(-n);
  const sum = recent.reduce((acc, x) => acc + x.net, 0);
  return sum / Math.max(1, recent.length);
};

const buildSeries = (monthly: MonthNet[], startingBalance: number, monthsBack: number): Point[] => {
  if (monthly.length === 0) return [];

  const take = monthly.slice(-monthsBack);
  // Build "actual" cumulative from the first selected month:
  let bal = startingBalance;
  // We want the *last* point to be close to "startingBalance", so run forward from (startingBalance - sum(nets)).
  const sum = take.reduce((acc, x) => acc + x.net, 0);
  bal = startingBalance - sum;

  const actual: Point[] = take.map((m) => {
    bal += m.net;
    return { label: m.label, value: Math.max(0, Math.round(bal)), kind: "actual" };
  });

  const savingsPerMonth = Math.round(avgRecentNet(monthly, 3));
  const now = new Date();
  const forecast: Point[] = Array.from({ length: 6 }).map((_, i) => {
    const future = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const label = future.toLocaleString(undefined, { month: "short" });
    const value = Math.max(0, Math.round(startingBalance + savingsPerMonth * (i + 1)));
    return { label, value, kind: "forecast" };
  });

  return [...actual, ...forecast];
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const SpendingForecast: React.FC<SpendingForecastProps> = ({
  accounts,
  transactions,
  region,
  monthsBack = 6,
}) => {
  const overview = useMemo(() => computeAccountOverview(accounts), [accounts]);
  const startingBalance = overview.spendingAvailable;

  const monthlyNet = useMemo(() => buildMonthlyNet(transactions), [transactions]);

  const series = useMemo(
    () => buildSeries(monthlyNet, startingBalance, monthsBack),
    [monthlyNet, startingBalance, monthsBack]
  );

  const savingsPerMonth = useMemo(() => Math.round(avgRecentNet(monthlyNet, 3)), [monthlyNet]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (series.length === 0) {
    return (
      <Card title="Cashflow forecast">
        <p className="text-sm text-white/70">
          Connect accounts and build history to model future cashflow.
        </p>
      </Card>
    );
  }

  // Split actual vs forecast
  const firstForecastIndex = series.findIndex((p) => p.kind === "forecast");
  const lastActualIndex = firstForecastIndex > 0 ? firstForecastIndex - 1 : series.length - 1;

  const values = series.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = Math.max(1, maxV - minV);

  // SVG sizing (mobile-first)
  const w = 680;
  const h = 220;
  const padX = 18;
  const padY = 18;

  const xFor = (i: number) => padX + (i * (w - padX * 2)) / Math.max(1, series.length - 1);
  const yFor = (v: number) => {
    const t = (v - minV) / range;
    return h - padY - t * (h - padY * 2);
  };

  const buildPath = (from: number, to: number) => {
    let d = "";
    for (let i = from; i <= to; i++) {
      const x = xFor(i);
      const y = yFor(series[i].value);
      d += `${i === from ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    return d.trim();
  };

  const actualPath = buildPath(0, lastActualIndex);
  const forecastPath = firstForecastIndex >= 0 ? buildPath(firstForecastIndex, series.length - 1) : "";

  // Area fill under actual+forecast (single fill)
  const areaPath = (() => {
    const top = buildPath(0, series.length - 1);
    const xLast = xFor(series.length - 1);
    const xFirst = xFor(0);
    const yBase = h - padY;
    return `${top} L ${xLast.toFixed(2)} ${yBase.toFixed(2)} L ${xFirst.toFixed(2)} ${yBase.toFixed(
      2
    )} Z`;
  })();

  const projected = series[series.length - 1]?.value ?? startingBalance;

  // Tooltip helpers (tap-friendly)
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = clamp((x / rect.width) * (series.length - 1), 0, series.length - 1);
    const idx = Math.round(t);
    setActiveIndex(idx);
  };

  const active = activeIndex != null ? series[activeIndex] : null;
  const activeX = activeIndex != null ? xFor(activeIndex) : null;
  const activeY = activeIndex != null ? yFor(series[activeIndex].value) : null;

  return (
    <Card title="Cashflow forecast">
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">
              Forecasted cashflow based on recent income and expenses.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/50">
              Avg net (3 mo)
            </p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(savingsPerMonth, region, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              <span className="ml-2 text-sm font-medium text-white/60">/ month</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">Projected</p>
            <p className="text-2xl font-semibold text-white">
              {formatCurrency(projected, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-emerald-300/90">Surplus</p>
          </div>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-black/30 p-4">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full touch-none"
            onPointerDown={onPointerMove}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id="cfLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#16A34A" stopOpacity="0.35" />
                <stop offset="0.55" stopColor="#22C55E" stopOpacity="0.8" />
                <stop offset="1" stopColor="#4ADE80" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="cfFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#22C55E" stopOpacity="0.22" />
                <stop offset="1" stopColor="#22C55E" stopOpacity="0" />
              </linearGradient>

              <filter id="greenGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="
                    1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.9 0"
                  result="glow"
                />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <pattern id="grid" width="56" height="36" patternUnits="userSpaceOnUse">
                <path d="M 56 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* grid */}
            <rect x="0" y="0" width={w} height={h} fill="url(#grid)" opacity="0.9" />

            {/* subtle bars (actual months only) */}
            {series.slice(0, lastActualIndex + 1).map((p, i) => {
              const x = xFor(i);
              const barW = (w - padX * 2) / Math.max(1, series.length - 1);
              const bw = Math.max(6, barW * 0.55);
              const y = yFor(p.value);
              const yBase = h - padY;
              return (
                <rect
                  key={`bar-${i}`}
                  x={x - bw / 2}
                  y={y}
                  width={bw}
                  height={Math.max(0, yBase - y)}
                  rx="3"
                  fill="rgba(34,197,94,0.16)"
                />
              );
            })}

            {/* fill */}
            <path d={areaPath} fill="url(#cfFill)" />

            {/* actual line */}
            <path
              d={actualPath}
              fill="none"
              stroke="rgba(34,197,94,0.55)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* forecast line (brighter + glow) */}
            {forecastPath && (
              <path
                d={forecastPath}
                fill="none"
                stroke="url(#cfLine)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#greenGlow)"
              />
            )}

            {/* separator dot at transition */}
            {firstForecastIndex >= 0 && (
              <circle
                cx={xFor(firstForecastIndex)}
                cy={yFor(series[firstForecastIndex].value)}
                r="4"
                fill="#4ADE80"
                opacity="0.95"
              />
            )}

            {/* tooltip */}
            {active && activeX != null && activeY != null && (
              <>
                <line
                  x1={activeX}
                  y1={padY}
                  x2={activeX}
                  y2={h - padY}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="2"
                />
                <circle cx={activeX} cy={activeY} r="6" fill="#4ADE80" opacity="0.95" filter="url(#greenGlow)" />
                <g transform={`translate(${clamp(activeX + 12, 12, w - 210)}, ${clamp(activeY - 46, 10, h - 72)})`}>
                  <rect
                    x="0"
                    y="0"
                    width="198"
                    height="56"
                    rx="16"
                    fill="rgba(0,0,0,0.55)"
                    stroke="rgba(255,255,255,0.12)"
                  />
                  <text x="14" y="22" fill="rgba(255,255,255,0.65)" fontSize="11" style={{ letterSpacing: "0.18em" }}>
                    {active.kind === "forecast" ? "FORECAST" : "ACTUAL"} • {active.label.toUpperCase()}
                  </text>
                  <text x="14" y="44" fill="white" fontSize="18" fontWeight="700">
                    {formatCurrency(active.value, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </text>
                </g>
              </>
            )}
          </svg>

          <div className="mt-3 flex justify-between text-[0.65rem] uppercase tracking-[0.28em] text-white/45">
            {series.map((p, i) => (
              <span
                key={`${p.label}-${i}`}
                className={i % 2 === 0 ? "" : "hidden sm:inline"}
                title={p.kind === "forecast" ? "Forecast" : "Actual"}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
          At this pace, your balance could reach{" "}
          <span className="font-semibold text-white">
            {formatCurrency(projected, region, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>{" "}
          in ~6 months.
        </div>
      </div>
    </Card>
  );
};

export default SpendingForecast;
