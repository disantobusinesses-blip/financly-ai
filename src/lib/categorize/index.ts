import { normalizeText } from "./normalizer";
import { type Tx, type Categorized } from "./categories";
import { categorizeByRules } from "./engine";
import { categorizeByAI } from "./ai";

const cache = new Map<string, { category: string; type: string; confidence: number }>();
const learningQueue = new Set<string>();

function cacheKey(tx: Tx) {
  const normalized = normalizeText(`${tx.merchantName || ""} ${tx.description || ""}`);
  return `${tx.currency}|${normalized}`;
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
      source: "ai",
      confidence: hit.confidence,
    };
  }

  const ai = await categorizeByAI(tx);
  cache.set(key, { category: ai.category, type: ai.type, confidence: ai.confidence });
  learningQueue.add(key);
  return ai;
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
export { categorizeByAI } from "./ai";
export type { Category, TxType, Tx, Categorized } from "./categories";
export { RULES, type Rule } from "./rules";
