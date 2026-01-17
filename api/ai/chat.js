import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is not set. /api/ai/chat will return errors until configured.");
}

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const MAX_PAYLOAD_BYTES = 20000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitCache = new Map();

const refusalMessage =
  "I can only help with your MyAiBank finances. Ask about spending, income, bills, subscriptions, categories, or saving tips.";

function getBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h) return null;
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

function getClientKey(req, userId) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return `${userId || "anon"}:${forwarded.split(",")[0].trim()}`;
  }
  return `${userId || "anon"}:${req.socket?.remoteAddress || "unknown"}`;
}

function isRateLimited(key) {
  const now = Date.now();
  const entry = rateLimitCache.get(key) || [];
  const windowed = entry.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (windowed.length >= RATE_LIMIT_MAX) {
    rateLimitCache.set(key, windowed);
    return true;
  }
  windowed.push(now);
  rateLimitCache.set(key, windowed);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  if (!openai) {
    return res.status(500).json({ error: { message: "OPENAI_API_KEY is not configured" } });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      error: { message: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured for /api/ai/chat" },
    });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: { message: "Missing Authorization bearer token" } });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    return res.status(401).json({ error: { message: "Invalid session" } });
  }

  const rawBody = req.body || {};
  const payloadSize = Buffer.byteLength(JSON.stringify(rawBody), "utf8");
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({ error: { message: "Payload too large" } });
  }

  const message = typeof rawBody.message === "string" ? rawBody.message.trim() : "";
  const financeContext =
    rawBody.financeContext && typeof rawBody.financeContext === "object" ? rawBody.financeContext : null;

  if (!message) {
    return res.status(400).json({ error: { message: "message is required" } });
  }

  const userId = authData.user.id;
  const clientKey = getClientKey(req, userId);
  if (isRateLimited(clientKey)) {
    return res.status(429).json({ error: { message: "Too many requests" } });
  }

  // ✅ Shorter answers enforced here
  const systemPrompt = `You are MyAiBank's in-app finance assistant.

Rules:
- Only answer using the provided financeContext JSON (if present).
- Allowed topics: transactions, accounts, income, outgoings, categories, subscriptions/recurring, budgeting, saving opportunities.
- If the question is unrelated OR cannot be answered from financeContext, reply exactly with:
"${refusalMessage}"

Style:
- Private banker tone: calm, minimal, data-driven.
- Keep answers SHORT: max 3 sentences OR max 5 bullet lines.
- Prefer numbers and summaries. No disclaimers unless asked.
- If the user wants detail, ask: "Want a breakdown by merchant/category?"`;

  try {
    console.log("AI_CHAT: calling OpenAI", { userId, hasFinanceContext: Boolean(financeContext) });

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      max_tokens: 220, // ✅ hard limit for short replies
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `User message: ${message}\n\nfinanceContext JSON:\n${JSON.stringify(financeContext || {})}`,
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content?.trim() || refusalMessage;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI_CHAT error", error);
    return res.status(500).json({ error: { message: "Unable to generate reply" } });
  }
}
