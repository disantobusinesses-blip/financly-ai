import { LockClosedIcon } from "@heroicons/react/24/outline";

interface ProFeatureBlockerProps {
  featureTitle: string;
  teaserText: string;
  children?: React.ReactNode;
}

export default function ProFeatureBlocker({
  featureTitle,
  teaserText,
  children,
}: ProFeatureBlockerProps) {
  return (
    <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      <div className="blur-sm pointer-events-none select-none">{children}</div>

      <div className="absolute inset-0 bg-white/70 dark:bg-black/50 backdrop-blur flex flex-col items-center justify-center p-6 text-center">
        <LockClosedIcon className="h-10 w-10 text-neutral-600 dark:text-neutral-300 mb-3" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {featureTitle} <span className="text-indigo-600">(Pro)</span>
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
          {teaserText}
        </p>
        <button
          onClick={() => (window.location.href = "/pricing")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow transition"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
