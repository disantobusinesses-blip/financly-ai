import React from "react";
import { ArrowDownIcon, ArrowUpIcon } from "./icon/Icon";

interface MonthlyDeltaProps {
  currentValue: number;
  previousValue?: number | null;
  formatter?: (value: number) => React.ReactNode;
  orientation?: "vertical" | "horizontal";
  className?: string;
  valueClassName?: string;
  deltaClassName?: string;
  iconClassName?: string;
  noPreviousLabel?: string;
}

const EPSILON = 0.0001;

const defaultFormatter = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const MonthlyDelta: React.FC<MonthlyDeltaProps> = ({
  currentValue,
  previousValue,
  formatter = defaultFormatter,
  orientation = "vertical",
  className = "",
  valueClassName = "",
  deltaClassName = "",
  iconClassName = "h-3.5 w-3.5",
  noPreviousLabel = "—",
}) => {
  const hasPrevious = previousValue !== undefined && previousValue !== null;
  const formattedValue = formatter(currentValue);

  let indicatorColor = "text-white/60";
  let IndicatorIcon: React.FC<{ className?: string }> | null = null;
  let label: React.ReactNode = noPreviousLabel;

  if (hasPrevious) {
    const base = Math.abs(previousValue!);
    if (base < EPSILON) {
      if (Math.abs(currentValue) < EPSILON) {
        label = "0%";
      } else {
        IndicatorIcon = ArrowUpIcon;
        indicatorColor = "text-emerald-400";
        label = "New";
      }
    } else {
      const rawDelta = ((currentValue - previousValue!) / base) * 100;
      const absoluteDelta = Math.abs(rawDelta);

      if (rawDelta > EPSILON) {
        IndicatorIcon = ArrowUpIcon;
        indicatorColor = "text-emerald-400";
      } else if (rawDelta < -EPSILON) {
        IndicatorIcon = ArrowDownIcon;
        indicatorColor = "text-rose-400";
      }

      label = `${absoluteDelta.toFixed(1)}%`;
    }
  }

  const containerBase =
    orientation === "horizontal" ? "flex items-center gap-2" : "flex flex-col gap-1";

  const valueClasses = `${valueClassName}`.trim();
  const deltaClasses = `${indicatorColor} ${deltaClassName}`.trim();
  const combinedContainer = `${containerBase} ${className}`.trim();

  return (
    <div className={combinedContainer}>
      <span className={valueClasses}>{formattedValue}</span>
      <span className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] ${deltaClasses}`}>
        {IndicatorIcon ? <IndicatorIcon className={iconClassName} /> : null}
        <span>{label}</span>
      </span>
    </div>
  );
};

export default MonthlyDelta;
