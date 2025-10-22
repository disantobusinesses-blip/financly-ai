import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, BalanceForecastResult, User } from "../types";
import { formatCurrency, getCurrencyInfo } from "../utils/currency";

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error(
    "VITE_API_KEY for Gemini is not set in environment variables. Please check your .env file or Vercel settings."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";
const DISCLAIMER = "This is not Financial advice.";

// --- Helper ---
const toNumber = (val: any, fallback = 0): number => {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? fallback : n;
};

const buildTransactionSnapshot = (
  transactions: Transaction[],
  region: User["region"]
) => {
  let income = 0;
  let expenses = 0;
  const categoryTotals: Record<string, number> = {};

  for (const txn of transactions) {
    const amount = toNumber(txn.amount, 0);
    if (amount >= 0) {
      income += amount;
    } else {
      const spend = Math.abs(amount);
      expenses += spend;
      const category = txn.category?.trim() || "General";
      categoryTotals[category] = (categoryTotals[category] || 0) + spend;
    }
  }

  const net = income - expenses;
  let topCategory = "";
  let topValue = 0;
  for (const [category, value] of Object.entries(categoryTotals)) {
    if (value > topValue) {
      topCategory = category;
      topValue = value;
    }
  }

  const stats: { label: string; value: string; tone?: "positive" | "negative" | "neutral" }[] = [
    {
      label: "Income recorded",
      value: formatCurrency(income, region),
      tone: income > 0 ? "positive" : "neutral",
    },
    {
      label: "Spending recorded",
      value: formatCurrency(expenses, region),
      tone: expenses > 0 ? "negative" : "neutral",
    },
    {
      label: "Net position",
      value: formatCurrency(net, region),
      tone: net >= 0 ? "positive" : "negative",
    },
  ];

  if (topCategory) {
    stats.push({
      label: "Top category",
      value: `${topCategory} (${formatCurrency(topValue, region)})`,
      tone: "neutral",
    });
  }

  const summary =
    net >= 0
      ? `You brought in ${formatCurrency(income, region)} and spent ${formatCurrency(expenses, region)}, leaving ${formatCurrency(net, region)} across these transactions.`
      : `You brought in ${formatCurrency(income, region)} and spent ${formatCurrency(expenses, region)}, leaving a shortfall of ${formatCurrency(Math.abs(net), region)} across these transactions.`;

  return { stats, summary };
};

// ------------------------------
// Transaction Insights
// ------------------------------
export interface TransactionAnalysisResult {
  insights: { emoji: string; text: string }[];
  summary: string;
  stats: { label: string; value: string; tone?: "positive" | "negative" | "neutral" }[];
  disclaimer: string;
}

export const getTransactionInsights = async (
  transactions: Transaction[],
  region: User["region"]
): Promise<TransactionAnalysisResult> => {
  const { stats, summary } = buildTransactionSnapshot(transactions, region);
  const { symbol } = getCurrencyInfo(region);
  const transactionSummary = transactions
    .slice(0, 100)
    .map((t) => `${t.date} • ${t.description}: ${symbol}${toNumber(t.amount).toFixed(2)}`)
    .join("\n");

  const prompt = `You are an AI assistant providing neutral financial observations. Do not give advice or instructions.

Return JSON with this shape:
{
  "insights": [
    { "emoji": "", "text": "One-sentence neutral observation." }
  ]
}

Keep each insight to 1 sentence, reference the data provided, and avoid prescriptive language.`;

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
          },
          required: ["insights"],
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    const parsed = jsonText ? JSON.parse(jsonText) : { insights: [] };
    const insights = Array.isArray(parsed.insights)
      ? parsed.insights.map((item: any) => ({
          emoji: typeof item?.emoji === "string" ? item.emoji : "✨",
          text: typeof item?.text === "string" ? item.text : "Activity noted.",
        }))
      : [];

    return {
      insights,
      summary,
      stats,
      disclaimer: DISCLAIMER,
    };
  } catch (error) {
    console.error("❌ Gemini TransactionInsights error:", error);
    return {
      insights: [],
      summary,
      stats,
      disclaimer: DISCLAIMER,
    };
  }
};

// ------------------------------
// Borrowing Power
// ------------------------------
export interface BorrowingPowerResult {
  estimatedLoanAmount: number;
  estimatedInterestRate: number;
  summary: string;
  stats: { label: string; value: string }[];
  disclaimer: string;
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

  const prompt = `You are an AI providing an informational borrowing power estimate only.
You are not a financial advisor. Provide neutral language and avoid directives.

Data:
- ${creditScoreContext}
- Income: ${symbol}${totalIncome.toFixed(2)}
- Net Worth: ${symbol}${totalBalance.toFixed(2)}

Return JSON:
{
  "estimatedLoanAmount": number,
  "estimatedInterestRate": number,
  "summary": string,
  "disclaimer": "${DISCLAIMER}"
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
            summary: { type: Type.STRING },
            disclaimer: { type: Type.STRING },
          },
          required: [
            "estimatedLoanAmount",
            "estimatedInterestRate",
            "summary",
            "disclaimer",
          ],
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    const parsed = JSON.parse(jsonText) as BorrowingPowerResult;
    const estimatedLoanAmount = toNumber(parsed.estimatedLoanAmount);
    const estimatedInterestRate = toNumber(parsed.estimatedInterestRate);
    const stats: { label: string; value: string }[] = [
      { label: "Annual income", value: formatCurrency(totalIncome, region) },
      { label: "Net balance", value: formatCurrency(totalBalance, region) },
    ];

    if (totalIncome > 0 && estimatedLoanAmount > 0) {
      const ratio = estimatedLoanAmount / totalIncome;
      stats.push({ label: "Loan vs income", value: `${ratio.toFixed(1)}x` });
    }

    return {
      estimatedLoanAmount,
      estimatedInterestRate,
      summary: parsed.summary ||
        `Based on the details provided, an illustrative borrowing capacity is ${formatCurrency(
          estimatedLoanAmount,
          region
        )} at roughly ${estimatedInterestRate.toFixed(2)}% p.a.`,
      stats,
      disclaimer: parsed.disclaimer || DISCLAIMER,
    };
  } catch (error) {
    console.error("❌ Gemini BorrowingPower error:", error);
    return {
      estimatedLoanAmount: 0,
      estimatedInterestRate: 0,
      summary: "Unable to generate an estimation right now.",
      stats: [
        { label: "Annual income", value: formatCurrency(totalIncome, region) },
        { label: "Net balance", value: formatCurrency(totalBalance, region) },
      ],
      disclaimer: DISCLAIMER,
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
Each alert should be helpful but not advisory. Always include a disclaimer: "${DISCLAIMER}"

Respond ONLY as a JSON array of objects:
[{ "type": string, "title": string, "description": string, "disclaimer": string }]
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
    const parsed = jsonText ? JSON.parse(jsonText) : [];
    return Array.isArray(parsed)
      ? parsed.map((alert: any) => ({
          type: alert?.type ?? "Anomaly",
          title: alert?.title ?? "Update",
          description: alert?.description ?? "Activity detected.",
          disclaimer: alert?.disclaimer ?? DISCLAIMER,
        }))
      : [];
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
This output is educational and not financial advice — include a "disclaimer" field.

User Data:
- Balance: ${symbol}${toNumber(currentBalance).toFixed(2)}
- Monthly extra savings potential: ${symbol}${toNumber(
    potentialMonthlySavings
  ).toFixed(2)}

Task:
1. Create 6-month forecast arrays for "default" and "optimized".
2. "Optimized" should grow faster but remain realistic.
3. Provide one insight comparing the two.
4. Add 2–3 key change actions (description only).
5. Include "disclaimer": "${DISCLAIMER}"

Respond only in valid JSON:
{
  "forecastData": [
    { "month": "Oct", "defaultForecast": 9000, "optimizedForecast": 9800 }
  ],
  "insight": "Following your plan could improve your balance by $800 in 6 months.",
  "keyChanges": [{ "description": "Reduce discretionary spending" }],
  "disclaimer": "${DISCLAIMER}"
}
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
            disclaimer: { type: Type.STRING },
          },
          required: ["forecastData", "insight", "keyChanges", "disclaimer"],
        },
      },
    });

    const jsonText = (response.text ?? "").trim();
    const parsed = JSON.parse(jsonText) as BalanceForecastResult & {
      disclaimer?: string;
    };

    parsed.forecastData = parsed.forecastData.map((f) => ({
      ...f,
      defaultForecast: toNumber(f.defaultForecast),
      optimizedForecast: toNumber(f.optimizedForecast),
    }));

    (parsed as any).disclaimer ||= DISCLAIMER;
    return parsed;
  } catch (error) {
    console.error("❌ Gemini BalanceForecast error:", error);
    return {
      forecastData: [],
      insight: "Unable to generate forecast.",
      keyChanges: [],
      disclaimer: DISCLAIMER,
    };
  }
};