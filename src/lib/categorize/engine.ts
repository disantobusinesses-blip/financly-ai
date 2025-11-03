import { RULES, type Rule } from "./rules";
import { normalizeText, regionFrom } from "./normalizer";
import { type Tx, type TxType, type Categorized } from "./categories";

function txTypeFrom(tx: Tx): TxType {
  if (tx.amount > 0) return "credit";
  if (tx.amount < 0) return "debit";
  return "unknown";
}

function matchRule(
  norm: string,
  region: "AU" | "US" | "ALL"
): { rule: Rule; confidence: number } | null {
  for (const r of RULES) {
    if (r.region !== "ALL" && r.region !== region) continue;
    if (r.keywords && r.keywords.some((k) => norm.includes(k))) {
      return { rule: r, confidence: r.confidence ?? 0.95 };
    }
    if (r.regex && new RegExp(r.regex, "i").test(norm)) {
      return { rule: r, confidence: r.confidence ?? 0.9 };
    }
  }
  return null;
}

export function categorizeByRules(tx: Tx): Categorized | null {
  const norm = normalizeText(`${tx.merchantName || ""} ${tx.description || ""}`);
  const region = regionFrom(tx);
  const hit = matchRule(norm, region);
  if (!hit) return null;

  return {
    id: tx.id,
    category: hit.rule.category,
    type: hit.rule.type ?? txTypeFrom(tx),
    source: "rule",
    confidence: hit.confidence,
    ruleId: hit.rule.id,
  };
}
