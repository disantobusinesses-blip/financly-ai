import React, { useEffect, useMemo, useState } from "react";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  mobileHint?: string;
}

interface DashboardTourProps {
  steps: TourStep[];
  isOpen: boolean;
  stepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const pointerSize = 36;

const DashboardTour: React.FC<DashboardTourProps> = ({ steps, isOpen, stepIndex, onNext, onBack, onClose }) => {
  const [pointerStyle, setPointerStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const step = useMemo(() => steps[stepIndex], [steps, stepIndex]);

  useEffect(() => {
    if (!isOpen || !step) return;
    const target = document.querySelector(`[data-tour-id="${step.id}"]`) as HTMLElement | null;
    if (!target) return;

    target.classList.add("tour-highlight");
    const rect = target.getBoundingClientRect();
    setPointerStyle({
      top: rect.top + window.scrollY + rect.height / 2 - pointerSize / 2,
      left: rect.left + window.scrollX + rect.width - pointerSize / 2,
    });

    return () => {
      target.classList.remove("tour-highlight");
    };
  }, [isOpen, step]);

  if (!isOpen || !step) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40" />
      <div
        className="pointer-events-none fixed z-50 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg shadow-xl"
        style={{ top: pointerStyle.top, left: pointerStyle.left }}
        aria-hidden
      >
        🧭
      </div>
      <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl ring-1 ring-primary/30 dark:bg-slate-900 dark:text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Guided tour</p>
        <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
        {step.mobileHint && <p className="mt-2 text-xs font-semibold text-primary">{step.mobileHint}</p>}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Step {stepIndex + 1} of {steps.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="pointer-events-auto rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-200"
              disabled={stepIndex === 0}
            >
              Back
            </button>
            {stepIndex + 1 === steps.length ? (
              <button
                onClick={onClose}
                className="pointer-events-auto rounded-xl bg-primary px-4 py-2 font-semibold text-white shadow hover:bg-primary/90"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={onNext}
                className="pointer-events-auto rounded-xl bg-primary px-4 py-2 font-semibold text-white shadow hover:bg-primary/90"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="fixed right-6 top-6 z-50 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-black/80"
      >
        Skip tour
      </button>
    </>
  );
};

export default DashboardTour;
