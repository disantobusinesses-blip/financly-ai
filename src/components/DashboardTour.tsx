import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { SparklesIcon } from "./icon/Icon";

interface DashboardTourProps {
  enabled: boolean;
}

interface Step {
  id: string;
  title: string;
  description: string;
  mobileHint?: string;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const STORAGE_KEY = "financly_dashboard_tour";

const steps: Step[] = [
  {
    id: "goal-planner",
    title: "Celebrate every goal",
    description:
      "Create savings goals, log contributions, and watch Financly celebrate your milestones with confetti and AI tips.",
  },
  {
    id: "financial-wellness-card",
    title: "Financial wellness overview",
    description:
      "Track your overall score out of 100 to see how your net worth, savings rate, and debt mix are trending each month.",
  },
  {
    id: "financial-wellness-dti",
    title: "Debt-to-income guidance",
    description:
      "Compare what you owe versus what you earn. We flag ratios above 50% and suggest next steps to get back to even.",
  },
  {
    id: "financial-wellness-rule",
    title: "50/30/20 rule",
    description:
      "See how your income splits between essentials, lifestyle, and savings so you can rebalance toward the 50/30/20 target.",
  },
  {
    id: "balance-summary-card",
    title: "Balance summary",
    description:
      "Check spending-ready cash, total net worth, and mortgage commitments at a glance across every connected account.",
  },
  {
    id: "subscription-hunter-card",
    title: "Subscription hunter",
    description:
      "Spot duplicate charges and see how often each subscription bills you so nothing slips through the cracks.",
    mobileHint: "On mobile, swipe right to bring Subscription Hunter into view, then tap Next.",
  },
  {
    id: "cashflow-mini-card",
    title: "Cashflow tracker",
    description:
      "Watch monthly inflows versus outflows with a zero baseline so you know exactly when you’re above or below break-even.",
    mobileHint: "Swipe right to keep following the tour on a phone.",
  },
  {
    id: "spending-by-category-card",
    title: "Spending by category",
    description:
      "Review polished category totals in dollars so you can tackle the biggest opportunities first.",
  },
  {
    id: "spending-forecast-card",
    title: "Cashflow forecast",
    description:
      "Forecast the month ahead with AI-assisted projections that factor in recent habits and upcoming bills.",
  },
  {
    id: "savings-coach-card",
    title: "Savings coach",
    description:
      "Let Gemini suggest smarter saving habits, highlight low-hanging opportunities, and estimate yearly impact.",
  },
  {
    id: "upcoming-bills-card",
    title: "Upcoming bills",
    description:
      "Preview due dates and set reminders so essential payments are handled before they become late fees.",
  },
  {
    id: "transactions-card",
    title: "Recent transactions",
    description:
      "Clean, dated transactions with AI-enriched categories keep your history easy to scan.",
  },
  {
    id: "transaction-analysis-card",
    title: "Transaction insights",
    description:
      "Dive deeper with anomaly detection, category call-outs, and trends sourced from your recent activity.",
  },
];

const getPreferredVariant = () => (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop");

function findTargetElement(stepId: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tour-id="${stepId}"]`)
  );
  if (nodes.length === 0) return null;

  const preferredVariant = getPreferredVariant();
  const byVariant = nodes.find((node) => node.dataset.tourVariant === preferredVariant);
  if (byVariant) return byVariant;

  const shared = nodes.find((node) => node.dataset.tourVariant === "shared");
  if (shared) return shared;

  return nodes[0] ?? null;
}

export default function DashboardTour({ enabled }: DashboardTourProps) {
  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState<"idle" | "prompt" | "running" | "finished">("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !enabled || status !== "idle") return;
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "completed" || stored === "skipped") {
      setStatus("finished");
    } else {
      setStatus("prompt");
    }
  }, [enabled, isClient, status]);

  useEffect(() => {
    if (!isClient || status !== "running") return;
    const current = steps[stepIndex];
    if (!current) return;

    const initialTarget = findTargetElement(current.id);
    if (initialTarget && typeof initialTarget.scrollIntoView === "function") {
      initialTarget.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }

    const updateRect = () => {
      const element = findTargetElement(current.id);
      if (!element) {
        setHighlightRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updateRect();
    const handleResize = () => updateRect();
    const handleScroll = () => updateRect();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isClient, stepIndex, status]);

  const activeStep = useMemo(() => steps[stepIndex] ?? null, [stepIndex]);
  const isLastStep = stepIndex === steps.length - 1;
  const tooltipPosition = useMemo(() => {
    if (!highlightRect) return null;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const desiredTop = highlightRect.top + highlightRect.height + 24;
    const maxTop = viewportHeight ? viewportHeight - 220 : desiredTop;
    const clampedTop = Math.max(16, Math.min(desiredTop, maxTop));
    const desiredLeft = highlightRect.left + highlightRect.width / 2;
    const clampedLeft = viewportWidth
      ? Math.max(24, Math.min(desiredLeft, viewportWidth - 24))
      : desiredLeft;
    return { top: clampedTop, left: clampedLeft };
  }, [highlightRect]);
  const highlightBoxStyle = useMemo(() => {
    if (!highlightRect) return null;
    const top = Math.max(highlightRect.top - 16, 16);
    let left = Math.max(highlightRect.left - 16, 16);
    if (typeof window !== "undefined") {
      const maxLeft = window.innerWidth - (highlightRect.width + 32) - 16;
      left = Math.min(left, Math.max(16, maxLeft));
    }
    return {
      top,
      left,
      width: highlightRect.width + 32,
      height: highlightRect.height + 32,
    };
  }, [highlightRect]);
  const iconPosition = useMemo(() => {
    if (!highlightRect) return null;
    const top = Math.max(highlightRect.top - 40, 8);
    const left =
      typeof window !== "undefined"
        ? Math.max(8, Math.min(highlightRect.left - 40, window.innerWidth - 56))
        : Math.max(highlightRect.left - 40, 8);
    return { top, left };
  }, [highlightRect]);

  const beginTour = () => {
    setStepIndex(0);
    setStatus("running");
    setHighlightRect(null);
  };

  const skipTour = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "skipped");
    }
    setStatus("finished");
  };

  const finishTour = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "completed");
    }
    setStatus("finished");
  };

  const goToNextStep = () => {
    if (isLastStep) {
      finishTour();
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  if (!isClient || !enabled || status === "finished") {
    return null;
  }

  if (status === "prompt") {
    return createPortal(
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Take the Financly tour</h2>
              <p className="text-sm text-slate-500">
                Get a guided walk-through of your dashboard so you know exactly where to find every tool.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 text-sm font-semibold">
            <button
              type="button"
              onClick={skipTour}
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              Skip tour
            </button>
            <button
              type="button"
              onClick={beginTour}
              className="rounded-full bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500"
            >
              Start tour
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (status !== "running" || !activeStep) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      {highlightRect ? (
        <>
          {highlightBoxStyle && (
            <div
              className="pointer-events-none absolute rounded-3xl border-2 border-indigo-400/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.4)]"
              style={{
                ...highlightBoxStyle,
                boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
              }}
            />
          )}
          <div
            className="pointer-events-none absolute flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg"
            style={{
              top: iconPosition?.top ?? Math.max(highlightRect.top - 40, 8),
              left: iconPosition?.left ?? Math.max(highlightRect.left - 40, 8),
            }}
          >
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div
            className="pointer-events-auto absolute w-full max-w-sm rounded-3xl bg-white p-5 text-slate-900 shadow-2xl"
            style={{
              top: tooltipPosition?.top ?? highlightRect.top + highlightRect.height + 24,
              left: tooltipPosition?.left ?? highlightRect.left + highlightRect.width / 2,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Step {stepIndex + 1}</p>
            <h3 className="mt-2 text-lg font-semibold">{activeStep.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{activeStep.description}</p>
            {activeStep.mobileHint && (
              <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600">
                {activeStep.mobileHint}
              </p>
            )}
            <div className="mt-4 flex justify-between text-sm font-semibold">
              <button
                type="button"
                onClick={skipTour}
                className="rounded-full border border-slate-200 px-4 py-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                Skip
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {steps.map((step, index) => (
                    <span
                      key={step.id}
                      className={`h-1.5 w-4 rounded-full transition ${
                        index <= stepIndex ? "bg-indigo-500" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500"
                >
                  {isLastStep ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
          <div className="max-w-sm rounded-3xl bg-white/95 p-5 text-center text-slate-900 shadow-xl">
            <h3 className="text-lg font-semibold">Scroll to continue</h3>
            <p className="mt-2 text-sm text-slate-600">
              We couldn't find this section yet. Scroll or swipe to bring it into view, then tap Next.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={goToNextStep}
                className="rounded-full bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500"
              >
                Skip step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
