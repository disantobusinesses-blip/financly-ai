import OpenAI from "openai";
import { getCachedReport, saveReport } from "./_lib/aiCacheStore.js";

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn(
    "⚠️ OPENAI_API_KEY is not set. AI endpoints will return errors until configured."
  );
}

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const TARGET_SPLIT = {
  Essentials: 50,
  Lifestyle: 30,
  Savings: 20,
};

const ESSENTIAL_KEYWORDS = [
  "rent",
  "mortgage",
  "utility",
  "electric",
  "gas",
  "water",
  "insurance",
  "premium",
  "woolworth",
  "coles",
  "aldi",
  "iga",
  "supermarket",
  "grocery",
  "petrol",
  "fuel",
  "7-eleven",
  "7 eleven",
  "bp",
  "caltex",
  "shell",
  "ampol",
  "transport",
  "train",
  "tram",
  "bus",
  "opal",
  "myki",
  "mygo",
  "child care",
  "daycare",
  "school",
  "education",
  "medical",
  "doctor",
  "hospital",
  "pharmacy",
  "chemist",
  "loan",
  "repayment",
  "debt",
  "credit card",
  "interest",
  "council",
  "rate",
  "tax",
  "registration",
  "internet",
  "phone",
  "mobile",
  "telstra",
  "optus",
  "vodafone",
  "energy",
  "origin",
  "agl",
  "energy australia",
  "woolies",
  "coles online",
  "bp petrol",
  "servo",
];

const LIFESTYLE_KEYWORDS = [
  "restaurant",
  "dining",
  "cafe",
  "coffee",
  "bar",
  "pub",
  "takeaway",
  "take away",
  "uber eats",
  "deliveroo",
  "doordash",
  "netflix",
  "spotify",
  "stan",
  "disney",
  "prime video",
  "youtube",
  "apple music",
  "itunes",
  "google play",
  "amazon",
  "ebay",
  "kmart",
  "target",
  "myer",
  "sephora",
  "mecca",
  "beauty",
  "salon",
  "spa",
  "gym",
  "fitness",
  "membership",
  "cinema",
  "movie",
  "ticket",
  "entertainment",
  "holiday",
  "travel",
  "hotel",
  "airbnb",
  "flight",
  "uber",
  "lyft",
  "ride share",
  "gaming",
  "playstation",
  "xbox",
  "switch",
  "steam",
  "binge",
  "foxtel",
  "league pass",
  "subscription",
  "membership",
];

const SAVINGS_KEYWORDS = [
  "savings",
  "investment",
  "invest",
  "micro-invest",
  "micro invest",
  "microinvest",
  "round up",
  "round-up",
  "deposit savings",
  "transfer to savings",
  "offset",
  "top up",
  "top-up",
  "stash",
  "raiz",
  "acorns",
  "stake",
  "etoro",
  "sharesies",
  "super",
  "401k",
  "retirement",
  "term deposit",
];

const DEBT_KEYWORDS = [
  "loan",
  "mortgage",
  "credit",
  "repayment",
  "debt",
  "card",
  "interest",
  "finance",
  "lender",
];

const round = (value) => Number(Number(value || 0).toFixed(2));

const matchKeyword = (descriptor, keywords) =>
  keywords.some((keyword) => descriptor.includes(keyword));

function classifyTransaction(transaction) {
  const descriptor = `${transaction.description || ""} ${
    transaction.category || ""
  }`
    .toLowerCase()
    .trim();

  if (transaction.amount >= 0) {
    return null;
  }

  if (matchKeyword(descriptor, SAVINGS_KEYWORDS)) {
    return "Savings";
  }

  if (matchKeyword(descriptor, ESSENTIAL_KEYWORDS)) {
    return "Essentials";
  }

  if (matchKeyword(descriptor, LIFESTYLE_KEYWORDS)) {
    return "Lifestyle";
  }

  if (descriptor.includes("subscription") || descriptor.includes("membership")) {
    return "Lifestyle";
  }

  return "Essentials";
}

function summariseTransactions(transactions = []) {
  let income = 0;
  let expenses = 0;
  let savings = 0;
  let debtPayments = 0;

  const categories = {
    Essentials: 0,
    Lifestyle: 0,
    Savings: 0,
  };

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (!Number.isFinite(amount) || amount === 0) {
      return;
    }

    if (amount > 0) {
      income += amount;
      return;
    }

    const value = Math.abs(amount);
    const classification = classifyTransaction(transaction);

    if (classification === "Savings") {
      savings += value;
    } else {
      expenses += value;
    }

    if (classification) {
      categories[classification] += value;
    }

    const descriptor = `${transaction.description || ""} ${
      transaction.category || ""
    }`
      .toLowerCase()
      .trim();
    if (DEBT_KEYWORDS.some((keyword) => descriptor.includes(keyword))) {
      debtPayments += value;
    }
  });

  const debtToIncomeRatio = income > 0 ? debtPayments / income : 1;

  return {
    income: round(income),
    expenses: round(expenses),
    savings: round(savings),
    debtPayments: round(debtPayments),
    debtToIncomeRatio: Number(debtToIncomeRatio.toFixed(4)),
    categories,
  };
}

function calculateWellnessScore(income, expenses, savings) {
  const safeIncome = income > 0 ? income : 1;
  const ratio = savings / safeIncome;
  const expenseRatio = expenses / safeIncome;
  return Math.round(ratio * 100 - expenseRatio * 50 + 50);
}

function calculateCategoryPercentages(categories, income) {
  const result = {};
  const safeIncome = income > 0 ? income : 1;
  Object.keys(categories).forEach((key) => {
    const value = Number(categories[key]) || 0;
    result[key] = Number(((value / safeIncome) * 100).toFixed(2));
  });
  return result;
}

async function analyzeFinancialData(cleanData) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    temperature: 0,
    top_p: 1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a financial analysis engine. Always return identical JSON for identical inputs. Use the provided values without estimating. Respond with JSON containing insights (array of {emoji,text}), alerts (array of {type,title,description,disclaimer}), forecast (object with forecastData array, insight, keyChanges array), subscriptions (array of {name,amount,cancellationUrl}), weeklyOrders (array of {title,why,impactMonthly,steps}), and disclaimer string exactly 'This is not financial advice.'",
      },
      {
        role: "user",
        content: JSON.stringify(cleanData),
      },
    ],
  });

  const content = response?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }
  return content.trim();
}

function parseJson(content, fallback) {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Failed to parse OpenAI response:", error, content);
    return fallback;
  }
}

const defaultAnalysis = {
  insights: [],
  alerts: [],
  forecast: {
    forecastData: [],
    insight: "",
    keyChanges: [],
  },
  subscriptions: [],
  weeklyOrders: [],
  disclaimer: "This is not financial advice.",
};

function sanitiseAnalysis(analysis) {
  const parsed = analysis || {};

  const insights = Array.isArray(parsed.insights) ? parsed.insights : [];
  const alerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];
  const subscriptions = Array.isArray(parsed.subscriptions)
    ? parsed.subscriptions
    : [];

  const forecast =
    parsed.forecast && typeof parsed.forecast === "object" ? parsed.forecast : {};

  const weeklyOrders = Array.isArray(parsed.weeklyOrders) ? parsed.weeklyOrders : [];

  return {
    insights: insights.map((item) => ({
      emoji: item?.emoji || "💡",
      text: item?.text || "",
    })),
    alerts: alerts.map((alert) => ({
      type: alert?.type || "Anomaly",
      title: alert?.title || "Check your activity",
      description: alert?.description || "We could not generate details.",
      disclaimer:
        typeof alert?.disclaimer === "string"
          ? alert.disclaimer
          : "This is not financial advice.",
    })),
    forecast: {
      forecastData: Array.isArray(forecast.forecastData)
        ? forecast.forecastData.map((entry) => ({
            month: entry?.month || "",
            defaultForecast: round(entry?.defaultForecast),
            optimizedForecast: round(entry?.optimizedForecast),
          }))
        : [],
      insight: forecast?.insight || "",
      keyChanges: Array.isArray(forecast?.keyChanges)
        ? forecast.keyChanges.map((change) => ({
            description: change?.description || "",
          }))
        : [],
    },
    subscriptions: subscriptions.map((sub) => ({
      name: sub?.name || "",
      amount: round(sub?.amount),
      cancellationUrl: sub?.cancellationUrl || "",
    })),
    weeklyOrders: weeklyOrders.slice(0, 5).map((o) => ({
      title: o?.title || "",
      why: o?.why || "",
      impactMonthly: round(o?.impactMonthly),
      steps: Array.isArray(o?.steps)
        ? o.steps.map((s) => String(s || "")).slice(0, 4)
        : [],
    })),
    disclaimer:
      typeof parsed.disclaimer === "string"
        ? parsed.disclaimer
        : "This is not financial advice.",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    userId = "anonymous",
    month,
    year,
    region = "US",
    transactions = [],
    accounts = [],
    totalBalance = 0,
    forceRefresh = false,
  } = req.body || {};

  const now = new Date();
  const periodMonth = Number(month) || now.getMonth() + 1;
  const periodYear = Number(year) || now.getFullYear();

  const cacheKey = {
    userId,
    month: periodMonth,
    year: periodYear,
  };

  if (!forceRefresh) {
    try {
      const cached = await getCachedReport(cacheKey);
      if (cached && cached.data) {
        return res.status(200).json({ ...cached.data, cached: true });
      }
    } catch (error) {
      console.error("⚠️ Failed to read AI cache store:", error);
    }
  }

  try {
    const summary = summariseTransactions(transactions);
    const cleanData = {
      cacheKey,
      region,
      month: periodMonth,
      year: periodYear,
      income: summary.income,
      expenses: summary.expenses,
      savings: summary.savings,
      debtPayments: summary.debtPayments,
      debtToIncomeRatio: summary.debtToIncomeRatio,
      wellnessScore: calculateWellnessScore(
        summary.income,
        summary.expenses,
        summary.savings
      ),
      categoryTotals: summary.categories,
      categoryPercentages: calculateCategoryPercentages(
        summary.categories,
        summary.income
      ),
      targetPercentages: TARGET_SPLIT,
      netWorth: round(totalBalance),
      accountsCount: Array.isArray(accounts) ? accounts.length : 0,
      generatedAt: new Date().toISOString(),
    };

    const responseText = await analyzeFinancialData(cleanData);
    const parsed = parseJson(responseText, defaultAnalysis);
    const analysis = sanitiseAnalysis(parsed);

    const payload = {
      cleanData,
      analysis,
      cached: false,
      generatedAt: new Date().toISOString(),
    };

    try {
      await saveReport({
        ...cacheKey,
        data: { ...payload, cached: true },
        updatedAt: payload.generatedAt,
      });
    } catch (error) {
      console.error("⚠️ Failed to persist AI analysis cache:", error);
    }

    return res.status(200).json(payload);
  } catch (error) {
    console.error("❌ OpenAI handler error:", error);
    return res.status(500).json({ error: error?.message || "AI request failed" });
  }
}
