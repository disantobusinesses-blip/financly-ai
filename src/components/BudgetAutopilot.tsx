import React, { useMemo } from "react";
import type { Transaction } from "../types";
import { formatCurrency } from "../utils/currency";
import { summariseMonthlyBudget } from "../utils/spending";

type Props = {
  transactions: Transaction[];
  region: "AU" | "US";
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const BudgetAutopilot: React.FC<Props> = ({ transactions, region }) => {
  const summary = useMemo(() => summariseMonthlyBudget(transactions), [transactions]);

  const pctNeeds = clamp(summary.percentages.Essentials);
  const pctWants = clamp(summary.percentages.Lifestyle);
  const pctSave = clamp(summary.percentages.Savings);

  const targetNeeds = summary.targetPercentages.Essentials; // 50
  const targetWants = summary.targetPercentages.Lifestyle; // 30
  const targetSave = summary.targetPercentages.Savings; // 20

  // Simple “On Track” logic with tolerance so it doesn’t feel jumpy.
  const onTrack = useMemo(() => {
    if (summary.income <= 0) return false;
    const tol = 2.5;
    const needsOk = pctNeeds <= targetNeeds + tol;
    const wantsOk = pctWants <= targetWants + tol;
    const saveOk = pctSave >= targetSave - tol;
    return needsOk && wantsOk && saveOk;
  }, [pctNeeds, pctWants, pctSave, targetNeeds, targetWants, targetSave, summary.income]);

  // Donut using conic-gradient (no chart libs).
  const donutStyle: React.CSSProperties = {
    background: `conic-gradient(
      rgba(16,185,129,0.95) 0% ${pctNeeds}%,
      rgba(168,85,247,0.95) ${pctNeeds}% ${pctNeeds + pctWants}%,
      rgba(59,130,246,0.95) ${pctNeeds + pctWants}% 100%
    )`,
  };

  const Row = ({
    label,
    amount,
    pct,
    target,
    tone,
  }: {
    label: string;
    amount: number;
    pct: number;
    target: number;
    tone: "emerald" | "violet" | "blue";
  }) => {
    const over = pct - target;
    const overText =
      over > 0
        ? `${over.toFixed(0)}% over target`
        : `${Math.abs(over).toFixed(0)}% under target`;

    const barWidth = clamp(pct);
    const barClass =
      tone === "emerald"
        ? "bg-emerald-400/90"
        : tone === "violet"
          ? "bg-violet-400/90"
          : "bg-blue-400/90";

    return (
      <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="mt-1 text-xs text-white/50">
              {pct.toFixed(0)}% of income (Target: {target}%)
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-white">
            {formatCurrency(amount, region)}
          </p>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-white/10">
          <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${barWidth}%` }} />
        </div>

        <p className="mt-2 text-[11px] text-white/45">{overText}</p>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-2 pb-10 pt-2">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white/80 transition hover:border-white/20 hover:text-white"
          aria-label="Back"
        >
          ←
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-white">Budget Autopilot</h1>
          <p className="text-sm text-white/55">50/30/20 Rule Applied</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 rounded-full p-[6px]" style={donutStyle}>
            <div className="h-full w-full rounded-full bg-[#06060b]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                  onTrack
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-200",
                ].join(" ")}
              >
                <span className={onTrack ? "text-emerald-300" : "text-amber-300"}>●</span>
                {onTrack ? "On Track" : "Needs attention"}
              </span>
            </div>

            <p className="mt-2 text-sm text-white/60">
              {summary.income > 0 ? (
                <>
                  Last 30 days income:{" "}
                  <span className="font-semibold text-white">
                    {formatCurrency(summary.income, region)}
                  </span>{" "}
                  • Spend tracked from your synced transactions.
                </>
              ) : (
                <>We need income transactions to calculate your 50/30/20 budget.</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Breakdown</h2>
        <div className="space-y-3">
          <Row
            label="Essentials (Needs)"
            amount={summary.totals.Essentials}
            pct={pctNeeds}
            target={targetNeeds}
            tone="emerald"
          />
          <Row
            label="Lifestyle (Wants)"
            amount={summary.totals.Lifestyle}
            pct={pctWants}
            target={targetWants}
            tone="violet"
          />
          <Row
            label="Savings / Debt"
            amount={summary.savingsAllocated}
            pct={pctSave}
            target={targetSave}
            tone="blue"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/70">
          Autopilot suggestion:{" "}
          <span className="text-white">
            {onTrack
              ? "keep this pace; increase Savings if you want faster goals."
              : "shift spending from Wants into Savings until you hit your targets."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetAutopilot;
