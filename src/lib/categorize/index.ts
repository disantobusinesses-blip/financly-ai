import { normalizeText } from "./normalizer";
import { type Tx, type Categorized } from "./categories";
import { categorizeByRules } from "./engine";

const cache = new Map<string, { category: string; type: string; confidence: number }>();
const learningQueue = new Set<string>();

function cacheKey(tx: Tx) {
  const normalized = normalizeText(`${tx.merchantName || ""} ${tx.description || ""}`);
  return `${tx.currency}|${normalized}`;
}

function fallbackCategorize(tx: Tx): Categorized {
  // Fallback categorization when AI is not available
  // Simple heuristic based on amount
  return {
    id: tx.id,
    category: "Misc",
    type: tx.amount > 0 ? "credit" : tx.amount < 0 ? "debit" : "unknown",
    source: "fallback",
    confidence: 0.3,
  };
}

export async function categorizeTx(tx: Tx): Promise<Categorized> {
  const ruled = categorizeByRules(tx);
  if (ruled) return ruled;

  const key = cacheKey(tx);
  const hit = cache.get(key);
  if (hit) {
    return {
      id: tx.id,
      category: hit.category as Categorized["category"],
      type: hit.type as Categorized["type"],
      source: "cache",
      confidence: hit.confidence,
    };
  }

  // Use fallback categorization instead of AI
  const result = fallbackCategorize(tx);
  cache.set(key, { category: result.category, type: result.type, confidence: result.confidence });
  learningQueue.add(key);
  return result;
}

export async function categorizeMany(txs: Tx[]): Promise<Categorized[]> {
  const out: Categorized[] = [];
  for (const t of txs) {
    out.push(await categorizeTx(t));
  }
  return out;
}

export function getLearningQueue(): string[] {
  return Array.from(learningQueue);
}

export async function exportLearningQueue(path = "learningQueue.json"): Promise<void> {
  if (typeof window !== "undefined") return;
  if (!learningQueue.size) return;
  const data = JSON.stringify({ keys: Array.from(learningQueue) }, null, 2);
  const { writeFile } = await import("fs/promises");
  await writeFile(path, data, "utf8");
}

export { categorizeByRules } from "./engine";
export type { Category, TxType, Tx, Categorized } from "./categories";
export { RULES, type Rule } from "./rules";
