// src/services/GeminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, BalanceForecastResult, User } from "../types";
import { getCurrencyInfo } from "../utils/currency";

// In Vite, API keys must be prefixed with VITE_
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error(
    "VITE_API_KEY for Gemini is not set in environment variables. Please check your .env file or Vercel settings."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

// --- Helper to ensure safe numbers ---
const toNumber = (val: any, fallback = 0): number => {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? fallback : n;
};

// ------------------------------
// Transaction Insights
// ------------------------------
export interface TransactionAnalysisResult {
  insights: { emoji: string; text: string }[];
  subscriptions: { name: string; amount: number; cancellationUrl: string }[];
  disclaimer?: string;
}

export const getTransactionInsights = async (
  transactions: Transaction[],
  region: User["region"]
): Promise<TransactionAnalysisResult> => {
  const { symbol } = getCurrencyInfo(region);
  const transactionSummary = transactions
    .map((t) => `${t.description}: ${symbol}${toNumber(t.amount).toFixed(2)}`)
    .join("\n");

  const prompt = `
    You are an AI assistant providing **general financial observations only**.
    You are NOT a licensed advisor — include a clear disclaimer: "This is not financial advice."

    Analyze the transactions for a ${
      region === "US" ? "US-based" : "Australian"
    } user.

    Tasks:
    1. Identify 3 interesting spending insights or patterns.
    2. Identify recurring subscriptions ONLY if they are consumer services (Netflix, Spotify, Disney+).
       - Exclude utilities, government payments, groceries, or bank fees.
    3. Include a field named "disclaimer" with the text "This is not financial advice."

    Respond ONLY in valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `${prompt}\n\nTransactions:\n${transactionSummary}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  emoji: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ["emoji", "text"],
              },
            },
            subscriptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  cancellationUrl: { type: Type.STRING },
                },
                required: ["name", "amount", "cancellationUrl"],
              },
            },
            disclaimer: { type: Type.STRING },
          },
          required: ["insights", "subscriptions", "disclaimer"],
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) return { insights: [], subscriptions: [], disclaimer: "This is not financial advice." };

    const parsed = JSON.parse(jsonText) as TransactionAnalysisResult;
    parsed.subscriptions = parsed.subscriptions.map((s) => ({
      ...s,
      amount: toNumber(s.amount),
    }));
    if (!parsed.disclaimer) parsed.disclaimer = "This is not financial advice.";
    return parsed;
  } catch (error) {
    console.error("❌ Gemini TransactionInsights error:", error);
    return { insights: [], subscriptions: [], disclaimer: "This is not financial advice." };
  }
};

// ------------------------------
// Borrowing Power
// ------------------------------
export interface BorrowingPowerResult {
  estimatedLoanAmount: number;
  estimatedInterestRate: number;
  advice: string;
  disclaimer?: string;
}

export const getBorrowingPower = async (
  creditScore: number,
  totalIncome: number,
  totalBalance: number,
  region: User["region"]
): Promise<BorrowingPowerResult> => {
  const { symbol } = getCurrencyInfo(region);
  const creditScoreContext =
    region === "US"
      ? `Credit Score: ${creditScore}/850`
      : `Credit Score: ${creditScore}/1000`;

  const prompt = `
    You are an AI providing an **informational borrowing power estimate** only.
    You are not a financial advisor. Include disclaimer: "This is not financial advice."

    Data:
    - ${creditScoreContext}
    - Income: ${symbol}${totalIncome.toFixed(2)}
    - Net Worth: ${symbol}${totalBalance.toFixed(2)}

    Return valid JSON:
    {
      "estimatedLoanAmount": number,
      "estimatedInterestRate": number,
      "advice": string,
      "disclaimer": "This is not financial advice."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedLoanAmount: { type: Type.NUMBER },
            estimatedInterestRate: { type: Type.NUMBER },
            advice: { type: Type.STRING },
            disclaimer: { type: Type.STRING },
          },
          required: ["estimatedLoanAmount", "estimatedInterestRate", "advice", "disclaimer"],
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    const parsed = JSON.parse(jsonText) as BorrowingPowerResult;

    return {
      estimatedLoanAmount: toNumber(parsed.estimatedLoanAmount),
      estimatedInterestRate: toNumber(parsed.estimatedInterestRate),
      advice: parsed.advice,
      disclaimer: parsed.disclaimer || "This is not financial advice.",
    };
  } catch (error) {
    console.error("❌ Gemini BorrowingPower error:", error);
    return {
      estimatedLoanAmount: 0,
      estimatedInterestRate: 0,
      advice: "Unable to generate estimation.",
      disclaimer: "This is not financial advice.",
    };
  }
};

// ------------------------------
// Financial Alerts
// ------------------------------
export const getFinancialAlerts = async (
  transactions: Transaction[],
  region: User["region"]
): Promise<any[]> => {
  const { symbol } = getCurrencyInfo(region);
  const transactionSummary = transactions
    .map(
      (t) =>
        `${t.description}: ${symbol}${toNumber(t.amount).toFixed(2)} on ${t.date}`
    )
    .join("\n");

  const prompt = `
    You are an AI Financial Watchdog. Identify 3 general alerts: anomalies, opportunities, or milestones.
    Each alert should be helpful but not advisory. Always include a disclaimer: "This is not financial advice."

    Respond ONLY as a JSON array of objects with:
    { type, title, description, disclaimer }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `${prompt}\n\nTransactions:\n${transactionSummary}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              disclaimer: { type: Type.STRING },
            },
            required: ["type", "title", "description", "disclaimer"],
          },
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    return jsonText ? JSON.parse(jsonText) : [];
  } catch (error) {
    console.error("❌ Gemini FinancialAlerts error:", error);
    return [];
  }
};

// ------------------------------
// Balance Forecast (Improved)
// ------------------------------
export const getBalanceForecast = async (
  transactions: Transaction[],
  currentBalance: number,
  potentialMonthlySavings: number,
  region: User["region"]
): Promise<BalanceForecastResult> => {
  const { symbol } = getCurrencyInfo(region);
  const transactionSummary = transactions
    .map(
      (t) =>
        `${t.date}: ${t.amount > 0 ? "Income" : "Expense"} ${symbol}${Math.abs(
          toNumber(t.amount)
        ).toFixed(2)} (${t.description})`
    )
    .slice(0, 50)
    .join("\n");

  const prompt = `
    You are an AI simulating a financial projection. 
    This output is educational and **not financial advice** — include a "disclaimer" field.

    User Data:
    - Balance: ${symbol}${toNumber(currentBalance).toFixed(2)}
    - Monthly extra savings potential: ${symbol}${toNumber(potentialMonthlySavings).toFixed(2)}

    Task:
    1. Create 6-month forecast arrays for "default" and "optimized".
    2. "Optimized" should grow faster but stay realistic.
    3. Provide 1 insight comparing them.
    4. Add 2–3 key change actions (description only).
    5. Include "disclaimer": "This is not financial advice."

    Respond only in valid JSON:
    {
      "forecastData": [{ "month": "Oct", "defaultForecast": 9000, "optimizedForecast": 9800 }],
      "insight": "Following your plan could improve your balance by $800 in 6 months