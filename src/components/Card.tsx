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
  positive: "text-emerald-600",
  negative: "text-rose-600",
  neutral: "text-slate-900",
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
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm ${className}`}
    >
      <div className="relative space-y-5 p-6 md:p-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              {icon && <span className="text-primary/80">{icon}</span>}
              <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
            </div>
            {subtitle && (
              <p className="mt-2 text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          {insights && insights.length > 0 && (
            <dl className="grid gap-3 text-right text-xs uppercase tracking-wide text-slate-400">
              {insights.map((chip) => (
                <div key={`${chip.label}-${chip.value}`} className="space-y-1">
                  <dt>{chip.label}</dt>
                  <dd
                    className={`text-sm font-semibold ${
                      chip.tone ? toneClassMap[chip.tone] : "text-slate-900"
                    }`}
                  >
                    {chip.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          {children}
        </div>
      </div>
    </section>
  );
});

export default Card;
