import { forwardRef } from "react";

interface InsightChip {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}

interface CardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  insights?: InsightChip[];
  className?: string;
  children: React.ReactNode;
}

const toneClassMap: Record<NonNullable<InsightChip["tone"]>, string> = {
  positive: "text-emerald-200",
  negative: "text-rose-200",
  neutral: "text-white",
};

const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
  title,
  subtitle,
  icon,
  insights,
  className = "",
  children,
  },
  ref
) {
  return (
      <section
        ref={ref}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-indigo-900 text-white shadow-xl ${className}`}
      >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-60 w-60 rounded-full bg-indigo-500/20 blur-2xl"
      />
      <div className="relative space-y-5 p-6 md:p-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              {icon && <span className="text-white/80">{icon}</span>}
              <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
            </div>
            {subtitle && (
              <p className="mt-2 text-sm text-white/70">
                {subtitle}
              </p>
            )}
          </div>
          {insights && insights.length > 0 && (
            <dl className="grid gap-3 text-right text-xs uppercase tracking-wide">
              {insights.map((chip) => (
                <div key={`${chip.label}-${chip.value}`} className="space-y-1">
                  <dt className="text-white/60">{chip.label}</dt>
                  <dd
                    className={`text-sm font-semibold ${
                      chip.tone ? toneClassMap[chip.tone] : "text-white"
                    }`}
                  >
                    {chip.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/90">
          {children}
        </div>
      </div>
    </section>
  );
});

export default Card;
