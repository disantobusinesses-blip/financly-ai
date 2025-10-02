// src/services/GeminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import {
  Transaction,
  FinancialAlert,
  SavingsPlan,
  Goal,
  BalanceForecastResult,
  Account,
  AccountType,
  User,
} from "../types";
import { getCurrencyInfo } from "../utils/currency";

const API_KEY = import.meta.env.VITE_API_KEY;
if (!API_KEY) {
  throw new Error(
    "VITE_API_KEY for Gemini is not set in environment variables. Please check your .env file or Vercel project settings."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

// 🔹 Helper: Coerce anything into a number
const toNumber = (val: any, fallback = 0): number => {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? fallback : n;
};

// --- Types for AI results ---
export interface TransactionAnalysisResult {
  insights: { emoji: string; text: string }[];
  subscriptions: { name: string; amount: number; cancellationUrl: string }[];
}

export interface BorrowingPowerResult {
  estimatedLoanAmount: number;
  estimatedInterestRate: number;
  advice: string;
}

// --- Existing functions (trimmed unchanged ones) ---
// Keep getTransactionInsights, getBorrowingPower, getFinancialAlerts, getSavingsPlan as you had
// Only changed getBalanceForecast + added numeric safety + disclaimers

/**
 * Generates a 6-month balance forecast.
 * @param transactions A list of user transactions.
 * @param currentBalance The user's current total balance.
 * @param potentialMonthlySavings The potential extra savings from the AI plan.
 * @param region The user's region ('AU' or 'US').
 */
export const getBalanceForecast = async (
  transactions: Transaction[],
  currentBalance: number,
  potentialMonthlySavings: number,
  region: User["region"]
): Promise<BalanceForecastResult> => {
  const { symbol } = getCurrencyInfo(region);

  const cleanTransactions = transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
  }));

  const transactionSummary = cleanTransactions
    .map(
      (t) =>
        `${t.date}: ${t.amount > 0 ? "Income" : "Expense"} of ${symbol}${Math.abs(
          t.amount
        ).toFixed(2)} for ${t.description}`
    )
    .slice(0, 50)
    .join("\n");

  const prompt = `
        You are a financial simulation AI for a ${
          region === "US" ? "US-based" : "Australian"
        } user. 
        ⚠ Important: Provide illustrative simulations only. Do NOT give personal financial advice.

        User's Financial Data:
        - Current Balance: ${symbol}${toNumber(currentBalance).toFixed(2)}
        - Potential Extra Savings per month: ${symbol}${toNumber(
          potentialMonthlySavings
        ).toFixed(2)}

        Transactions (sampled):
        ${transactionSummary}

        Your Task:
        1. Default Forecast = balance projection with current spending patterns.
        2. Optimized Forecast = same, but add "Potential Extra Savings" every month.
        3. Insight = strictly an educational statement comparing the two.
        4. Key Changes = list top 2-3 generic optimization actions.

        Return JSON only with fields:
        - forecastData: 6 months of { month, defaultForecast, optimizedForecast }
        - insight: string disclaimer-style message
        - keyChanges: array of { description }
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
            forecastData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  defaultForecast: { type: Type.NUMBER },
                  optimizedForecast: { type: Type.NUMBER },
                },
                required: ["month", "defaultForecast", "optimizedForecast"],
              },
            },
            insight: { type: Type.STRING },
            keyChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { description: { type: Type.STRING } },
                required: ["description"],
              },
            },
          },
          required: ["forecastData", "insight", "keyChanges"],
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) throw new Error("Empty AI response for balance forecast.");

    const parsed = JSON.parse(jsonText) as BalanceForecastResult;

    // ✅ Coerce all numbers to avoid .toFixed errors
    parsed.forecastData = parsed.forecastData.map((d) => ({
      ...d,
      defaultForecast: toNumber(d.defaultForecast),
      optimizedForecast: toNumber(d.optimizedForecast),
    }));

    // ✅ Add disclaimer to protect you (AFSL compliance)
    parsed.insight =
      parsed.insight +
      " (⚠ This is a simulated projection for educational purposes only, not financial advice.)";

    return parsed;
  } catch (error) {
    console.error("Error calling Gemini API for balance forecast:", error);
    throw new Error("Failed to get balance forecast from the AI assistant.");
  }
};
