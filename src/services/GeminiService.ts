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
    You are an AI assistant providing **general financial insights only**. 
    You are NOT a licensed advisor, so avoid providing regulated financial advice.

    Analyze the following transactions for a ${
      region === "US" ? "US-based" : "Australian"
    } user.

    Tasks:
    1. Identify 3 interesting spending insights or patterns.
    2. Identify recurring subscriptions ONLY if they are recognizable consumer services (Netflix, Spotify, Disney+).
       - Exclude utilities, bank fees, government payments, or groceries.
       - Provide name, monthly amount, and a cancellation URL.

    Respond ONLY as valid JSON, no extra text.
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
          },
          required: ["insights", "subscriptions"],
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) return { insights: [], subscriptions: [] };

    const parsed = JSON.parse(jsonText) as TransactionAnalysisResult;
    // ensure numbers
    parsed.subscriptions = parsed.subscriptions.map((s) => ({
      ...s,
      amount: toNumber(s.amount),
    }));
    return parsed;
  } catch (error) {
    console.error("❌ Gemini TransactionInsights error:", error);
    return { insights: [], subscriptions: [] };
  }
};

// ------------------------------
// Borrowing Power
// ------------------------------
export interface BorrowingPowerResult {
  estimatedLoanAmount: number;
  estimatedInterestRate: number;
  advice: string;
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
    You are an AI assistant. Provide only an **informational estimation** 
    of borrowing power for a ${region === "US" ? "US" : "Australian"} user. 
    This is NOT financial advice and should not be relied on for real decisions.

    Data:
    - ${creditScoreContext}
    - Income: ${symbol}${totalIncome.toFixed(2)}
    - Net Worth: ${symbol}${totalBalance.toFixed(2)}

    Return JSON with estimatedLoanAmount, estimatedInterestRate, and a short advisory note.
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
          },
          required: ["estimatedLoanAmount", "estimatedInterestRate", "advice"],
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) throw new Error("Empty AI response for borrowing power.");
    const parsed = JSON.parse(jsonText) as BorrowingPowerResult;

    return {
      estimatedLoanAmount: toNumber(parsed.estimatedLoanAmount),
      estimatedInterestRate: toNumber(parsed.estimatedInterestRate),
      advice: parsed.advice,
    };
  } catch (error) {
    console.error("❌ Gemini BorrowingPower error:", error);
    return {
      estimatedLoanAmount: 0,
      estimatedInterestRate: 0,
      advice: "Unable to generate estimation.",
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
    You are an AI Financial Watchdog. Provide **general insights only**.
    Do NOT provide financial advice.

    Analyze transactions for anomalies, opportunities, or milestones.
    - Max 3 alerts.
    - "Opportunity" alerts should include a negotiation tip, but no guarantees.

    Respond ONLY as a JSON array of { type, title, description }.
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
            },
            required: ["type", "title", "description"],
          },
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) return [];
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("❌ Gemini FinancialAlerts error:", error);
    return [];
  }
};

// ------------------------------
// Balance Forecast
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
    You are an AI providing **general financial forecasting only**.
    This is NOT financial advice. Output must be safe to display.

    User Data:
    - Balance: ${symbol}${toNumber(currentBalance).toFixed(2)}
    - Potential Extra Savings: ${symbol}${toNumber(
      potentialMonthlySavings
    ).toFixed(2)}

    Task:
    1. Create a default forecast for 6 months based on current patterns.
    2. Create an optimized forecast if extra savings are added monthly.
    3. Provide one sentence insight comparing the two.
    4. Provide 2-3 key changes from the savings plan that drive improvement.

    Respond ONLY with valid JSON.
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
    if (!jsonText) throw new Error("Empty AI response for forecast.");
    const parsed = JSON.parse(jsonText) as BalanceForecastResult;

    // Ensure numbers are numbers
    parsed.forecastData = parsed.forecastData.map((f) => ({
      ...f,
      defaultForecast: toNumber(f.defaultForecast),
      optimizedForecast: toNumber(f.optimizedForecast),
    }));

    return parsed;
  } catch (error) {
    console.error("❌ Gemini BalanceForecast error:", error);
    return {
      forecastData: [],
      insight: "Unable to generate forecast.",
      keyChanges: [],
    };
  }
};
