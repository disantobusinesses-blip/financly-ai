import { OpenAI } from "openai";
import { getUserFromRequest } from "../../src/server/auth";
import { getFinanceContextForUser } from "../../src/server/finance-context";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return safeJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const { message } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return safeJson(res, 400, { error: "Missing message" });
    }

    const user = await getUserFromRequest(req);
    if (!user?.id) {
      return safeJson(res, 401, { error: "Unauthorized" });
    }

    const financeContext = await getFinanceContextForUser(user.id);

    console.log("AI_CHAT: calling OpenAI", {
      userId: user.id,
      hasFinanceContext: Boolean(financeContext),
    });

    const system = [
      "You are MyAiBank’s private-banker assistant.",
      "Finance-only: spending, income, subscriptions, categories, saving tips based on user data.",
      "No news. No unrelated Q&A. No jokes.",
      "Be calm, direct, data-driven.",
      "Keep answers SHORT: max 2 sentences OR max 4 bullet lines.",
      "If data is missing, ask ONE clarifying question and suggest the user refresh/reconnect bank.",
    ].join(" ");

    const userPrompt = [
      "User message:",
      message,
      "",
      "User finance context (may be empty):",
      financeContext ? JSON.stringify(financeContext) : "{}",
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 160,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    });

    const answer = completion?.choices?.[0]?.message?.content?.trim() || "I can help with your MyAiBank finances.";

    return safeJson(res, 200, { answer });
  } catch (err) {
    const msg = String(err?.message || err);
    console.error("AI_CHAT error", err);

    // If OpenAI returns structured error, surface a safe message.
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return safeJson(res, 429, {
        error: "AI is temporarily unavailable (quota/rate limit). Please try again shortly.",
      });
    }

    return safeJson(res, 500, { error: "AI request failed" });
  }
}
