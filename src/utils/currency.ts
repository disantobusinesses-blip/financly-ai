import { User } from "../types";

export const getCurrencyInfo = (region: User["region"] = "AU") =>
  region === "US"
    ? { symbol: "$", code: "USD", locale: "en-US" }
    : { symbol: "A$", code: "AUD", locale: "en-AU" };

const extractNumericAmount = (value: number | string | null | undefined): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const numericMatches = value.match(/-?\d+(?:\.\d+)?/g);
    if (numericMatches && numericMatches.length > 0) {
      const parsed = Number.parseFloat(numericMatches[0]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    const cleaned = value.replace(/[^0-9.-]+/g, "");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const normaliseAmount = (value: number | string): number =>
  Math.round(extractNumericAmount(value) * 100) / 100;

/**
 * Consistent currency formatting that respects the user's region while allowing
 * specific account currency overrides when Basiq returns multi-currency data.
 */
export const formatCurrency = (
  amount: number | string,
  region: User["region"] = "AU",
  currencyOverride?: string
) => {
  const { locale, code, symbol } = getCurrencyInfo(region);
  const currency = (currencyOverride || code).toUpperCase();
  const safeAmount = normaliseAmount(amount);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    const absolute = Math.abs(safeAmount).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const resolvedSymbol = currencyOverride ? `${currency} ` : symbol;
    return safeAmount < 0
      ? `-${resolvedSymbol}${absolute}`
      : `${resolvedSymbol}${absolute}`;
  }
};
