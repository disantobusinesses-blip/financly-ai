import OpenAI from "openai";
import { type Tx, type Categorized } from "./categories";
import { normalizeText } from "./normalizer";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  client = new OpenAI({ apiKey });
  return client;
}

const SYSTEM = `You categorize bank transactions for AU and US.
Return strict JSON: {"category":"<one>","type":"<one>","confidence":0-1,"reason":"<short>"}.
Categories: Income, Rent/Mortgage, Utilities, Groceries, Dining, Transport, Fuel, Health, Subscriptions, Shopping, Education, Travel, Fees, Transfers, Cash, Taxes, Charity, Misc.
Type: credit | debit | transfer | refund | fee | atm | interest | unknown.
If description implies transfer/refund/fee/atm/interest, set type accordingly. If unclear, infer from amount sign.
Be concise. Do not invent merchants.`;

const FEW_SHOTS = [
  { role: "user", content: '{"desc":"NETFLIX.COM AU","amount":-22.99,"currency":"AUD"}' },
  { role: "assistant", content: '{"category":"Subscriptions","type":"debit","confidence":0.98,"reason":"Known subscription"}' },
  { role: "user", content: '{"desc":"PAYROLL ACME CORP","amount":2500,"currency":"USD"}' },
  { role: "assistant", content: '{"category":"Income","type":"credit","confidence":0.99,"reason":"Payroll"}' },
] as const;

export async function categorizeByAI(tx: Tx): Promise<Categorized> {
  const payload = {
    desc: normalizeText(`${tx.merchantName || ""} ${tx.description || ""}`),
    amount: tx.amount,
    currency: tx.currency,
    mcc: tx.mcc || null,
  };

  const res = await getClient().chat.completions.create({
    model: "gpt-5.2",
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM },
      ...FEW_SHOTS,
      { role: "user", content: JSON.stringify(payload) },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(res.choices[0].message.content || "{}");
  return {
    id: tx.id,
    category: parsed.category || "Misc",
    type: parsed.type || (tx.amount > 0 ? "credit" : "debit"),
    source: "ai",
    confidence:
      typeof parsed.confidence === "number" ? parsed.confidence : 0.6,
    aiReason: parsed.reason || undefined,
  };
}
