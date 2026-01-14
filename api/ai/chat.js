import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!openaiApiKey) {
  console.warn("⚠️ OPENAI_API_KEY is not set. /api/ai/chat will return errors until configured.");
}

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const MAX_PAYLOAD_BYTES = 20000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const rateLimitCache = new Map();

const getClientKey = (req, financeContext) => {
  const headerKey = req.headers["x-user-id"] || req.headers["x-forwarded-for"];
  if (typeof headerKey === "string" && headerKey.trim()) {
    return headerKey.split(",")[0].trim();
  }
  if (financeContext && typeof financeContext.userId === "string") {
    return financeContext.userId;
  }
  return req.socket?.remoteAddress || "anonymous";
};

const isRateLimited = (key) => {
  const now = Date.now();
  const entry = rateLimitCache.get(key) || [];
  const windowed = entry.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (windowed.length >= RATE_LIMIT_MAX) {
    rateLimitCache.set(key, windowed);
    return true;
  }
  windowed.push(now);
  rateLimitCache.set(key, windowed);
  return false;
};

const refusalMessage =
  "I can only help with your MyAiBank finances. Ask about spending, income, bills, subscriptions, or saving tips.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  if (!openai) {
    return res.status(500).json({ error: { message: "OPENAI_API_KEY is not configured" } });
  }

  const rawBody = req.body || {};
  const payloadSize = Buffer.byteLength(JSON.stringify(rawBody), "utf8");
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({ error: { message: "Payload too large" } });
  }

  const message = typeof rawBody.message === "string" ? rawBody.message.trim() : "";
  const financeContext = rawBody.financeContext && typeof rawBody.financeContext === "object" ? rawBody.financeContext : null;

  if (!message || !financeContext) {
    return res.status(400).json({ error: { message: "message and financeContext are required" } });
  }

  const clientKey = getClientKey(req, financeContext);
  if (isRateLimited(clientKey)) {
    return res.status(429).json({ error: { message: "Too many requests" } });
  }

  const systemPrompt = `You are the MyAiBank Mascot Assistant. You must only answer questions about the user's finances using the provided financeContext JSON. Allowed topics: transactions, accounts, income, outgoings, categories, subscriptions, recurring payments, budgeting, and savings opportunities. If the question is unrelated or cannot be answered from the financeContext, reply exactly with: "${refusalMessage}". Do not browse the web or mention external data. Keep replies concise, friendly, premium, and grounded in the provided numbers. When possible, cite specific amounts, dates, and merchants from financeContext.`;

  try {
    const response = await openai.chat.completions.create({
      model: openaiModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `User message: ${message}\n\nfinanceContext JSON:\n${JSON.stringify(financeContext)}`,
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content?.trim() || refusalMessage;

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Mascot assistant error", error);
    return res.status(500).json({ error: { message: "Unable to generate reply" } });
  }
}
