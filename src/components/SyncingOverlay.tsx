import React from "react";

export interface SyncingOverlayProps {
  open: boolean;
  title?: string;
  message?: string;
  progress?: number; // 0-100
  details?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const SyncingOverlay: React.FC<SyncingOverlayProps> = ({
  open,
  title = "Syncing your bank data",
  message = "This may take a moment…",
  progress = 10,
  details,
}) => {
  if (!open) return null;
  const pct = clamp(Number.isFinite(progress) ? progress : 0, 0, 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white shadow-2xl">
        <svg
          className="mx-auto mb-4 h-10 w-10 animate-spin text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>

        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-white/70">{message}</p>

        <div className="mt-5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${pct}%` }}
            aria-label="Sync progress"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
        <div className="mt-2 text-xs text-white/60">{pct}%</div>

        {details && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-black/30 p-3 text-left text-xs text-white/70">
            {details}
          </pre>
        )}
      </div>
    </div>
  );
};

export default SyncingOverlay;
