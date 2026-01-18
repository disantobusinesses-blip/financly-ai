import React from "react";

type CardProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
};

export default function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
}: CardProps) {
  return (
    <section
      className={[
        "futuristic-card rounded-3xl border border-white/10",
        "shadow-2xl shadow-black/40 backdrop-blur",
        className,
      ].join(" ")}
    >
      <header
        className={[
          "flex items-start justify-between gap-4",
          "px-5 pt-5 sm:px-6 sm:pt-6",
          headerClassName,
        ].join(" ")}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/55">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm text-white/70">{subtitle}</p>
          ) : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>

      <div className={["px-5 pb-5 pt-4 sm:px-6 sm:pb-6", bodyClassName].join(" ")}>
        {children}
      </div>
    </section>
  );
}
