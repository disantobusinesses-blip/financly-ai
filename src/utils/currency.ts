import { User } from "../types";

interface CurrencyInfo {
  symbol: string;
  code: "AUD" | "USD";
  locale: string;
}

interface FormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const getCurrencyInfo = (region: User["region"] = "AU"): CurrencyInfo => {
  return region === "US"
    ? { symbol: "$", code: "USD", locale: "en-US" }
    : { symbol: "A$", code: "AUD", locale: "en-AU" };
};

export const formatCurrency = (
  amount: number,
  region: User["region"] = "AU",
  options: FormatCurrencyOptions = {}
) => {
  const { code, locale } = getCurrencyInfo(region);
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
};
