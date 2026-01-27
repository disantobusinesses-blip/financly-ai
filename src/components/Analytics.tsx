import React, { useMemo } from "react";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

type BarPoint = { label: string; value: number };
type DonutSlice = { label: string; value: number };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const round0 = (n: number) => Math.round(n);

const dotClass = (label: string) => {
  // Keep consistent with the rest of the app (no redesign; just subtle category dots)
  switch (label) {
    case "Housing":
      return "bg-violet-400";
    case "Food":
      return "bg-sky-400";
    case "Transport":
      return "bg-emerald-400";
    case "Entertainment":
      return "bg-amber-300";
    case "Other":
      return "bg-red-400";
    default:
      return "bg-white/50";
  }
};

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  // Placeholder analytics (until you wire from transactions).
  // This matches the “Figma” layout: tiles + bar chart + donut.
  const kpis = useMemo(
    () => [
      { label: "Income Growth", valueText: "+12%", icon: ArrowTrendingUpIcon, tone: "positive" as const },
      { label: "Spending Reduced", valueText: "-8%", icon: ArrowTrendingDownIcon, tone: "neutral" as const },
      { label: "Average Daily", valueText: formatCurrency(94, region), icon: ArrowTrendingUpIcon, tone: "violet" as const },
    ],
    [region]
  );

  const monthlyIncome = useMemo<BarPoint[]>(
    () => [
      { label: "Jan", value: 4200 },
      { label: "Feb", value: 4650 },
      { label: "Mar", value: 3980 },
      { label: "Apr", value: 5120 },
      { label: "May", value: 5750 },
    ],
    []
  );

  const expenseBreakdown = useMemo<DonutSlice[]>(
    () => [
      { label: "Housing", value: 1200 },
      { label: "Food", value: 450 },
      { label: "Transport", value: 300 },
      { label: "Entertainment", value: 150 },
      { label: "Other", value: 200 },
    ],
    []
  );

  const bar = useMemo(() => {
    const w = 320;
    const h = 160;
    const padX = 12;
    const padY = 18;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;

    const maxV = Math.max(...monthlyIncome.map((p) => p.value), 1);
    const barW = innerW / monthlyIncome.length;
    const gap = Math.max(6, barW * 0.18);
    const colW = barW - gap;

    const cols = monthlyIncome.map((p, i) => {
      const height = (p.value / maxV) * innerH;
      const x = padX + i * barW + gap / 2;
      const y = padY + (innerH - height);
      return { ...p, x, y, width: colW, height };
    });

    return { w, h, cols };
  }, [monthlyIncome]);

  const donut = useMemo(() => {
    const total = expenseBreakdown.reduce((s, x) => s + x.value, 0) || 1;
    const radius = 44;
    const stroke = 12;
    const c = 2 * Math.PI * radius;

    let acc = 0;
    const segs = expenseBreakdown.map((s) => {
      const pct = (s.value / total) * 100;
      const pctClamped = clamp(pct, 0, 100);
      const len = (pctClamped / 100) * c;
      const dash = `${len} ${c - len}`;
      const offset = (acc / 100) * c;
      acc += pctClamped;
      return { ...s, pct: pctClamped, dash, offset };
    });

    return { total, radius, stroke, segs };
  }, [expenseBreakdown]);

  return (
    <div className="relative flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-white/55">Insights &amp; breakdowns</p>
        </div>
      </div>

      {/* KPI Tiles */}
      <section className="grid gap-3 sm:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          const border =
            k.tone === "positive"
              ? "border-emerald-500/20"
              : k.tone === "violet"
              ? "border-violet-500/25"
              : "border-white/10";

          const glow =
            k.tone === "positive"
              ? "from-emerald-500/10 to-transparent"
              : k.tone === "violet"
              ? "from-violet-500/15 to-transparent"
              : "from-white/5 to-transparent";

          return (
            <div
              key={k.label}
              className={["relative overflow-hidden rounded-3xl border bg-[#0b0b10] p-4 shadow-2xl shadow-black/40", border].join(" ")}
            >
              <div className={["pointer-events-none absolute inset-0 bg-gradient-to-b", glow].join(" ")} />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">{k.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{k.valueText}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                  <Icon className="h-5 w-5 text-white/75" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Monthly Income (Bar Chart) */}
      <section className="rounded-3xl border border-white/10 bg-[#0b0b10] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Monthly Income</h2>
            <p className="text-sm text-white/55">Last 5 months</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
            <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-300/90" />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
          <svg viewBox={`0 0 ${bar.w} ${bar.h}`} className="h-[180px] w-full">
            {bar.cols.map((c) => (
              <g key={c.label}>
                <rect
                  x={c.x}
                  y={c.y}
                  width={c.width}
                  height={c.height}
                  rx={10}
                  ry={10}
                  fill="rgba(168,85,247,0.85)"
                />
                <text x={c.x + c.width / 2} y={bar.h - 6} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.55)">
                  {c.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      {/* Expense Breakdown (Donut) */}
      <section className="rounded-3xl border border-white/10 bg-[#0b0b10] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Expense Breakdown</h2>
            <p className="text-sm text-white/55">Current month</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
            <span className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
          </div>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
          <div className="flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <g transform="translate(70,70)">
                <circle r={donut.radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={donut.stroke} />
                {donut.segs.map((s) => (
                  <g
                    key={s.label}
                    className={
                      s.label === "Housing"
                        ? "text-violet-400"
                        : s.label === "Food"
                        ? "text-sky-400"
                        : s.label === "Transport"
                        ? "text-emerald-400"
                        : s.label === "Entertainment"
                        ? "text-amber-300"
                        : "text-red-400"
                    }
                  >
                    <circle
                      r={donut.radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={donut.stroke}
                      strokeLinecap="round"
                      strokeDasharray={s.dash}
                      strokeDashoffset={-s.offset}
                    />
                  </g>
                ))}
                <circle r={donut.radius - donut.stroke} fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.06)" />
              </g>
              <text x="70" y="72" textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.85)" fontWeight="600">
                {formatCurrency(donut.total, region)}
              </text>
              <text x="70" y="90" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.5)">
                Total
              </text>
            </svg>
          </div>

          <div className="space-y-3">
            {donut.segs.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className={["h-2.5 w-2.5 rounded-full", dotClass(s.label)].join(" ")} />
                  <span className="font-semibold text-white/80">{s.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/55">{round0(s.pct)}%</span>
                  <span className="font-semibold text-white/80">{formatCurrency(s.value, region)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-white/45">
          Educational insights only. We’ll wire real figures from transactions next.
        </div>
      </section>
    </div>
  );
};

export default Analytics;
