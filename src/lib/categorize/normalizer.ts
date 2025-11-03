export function normalizeText(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\d{2,}/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function regionFrom(tx: { currency?: string; regionHint?: "AU" | "US" }): "AU" | "US" | "ALL" {
  if (tx.regionHint) return tx.regionHint;
  if (tx.currency === "AUD") return "AU";
  if (tx.currency === "USD") return "US";
  return "ALL";
}
