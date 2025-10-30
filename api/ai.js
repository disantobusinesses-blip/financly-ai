import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn(
    "⚠️ OPENAI_API_KEY is not set. AI endpoints will return errors until configured."
  );
}

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const currencySymbol = (region = "US") => (region === "US" ? "$" : "A$");

const safeNumber = (value, fallback = 0) => {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? num : fallback;
};

async function callChat(messages, responseFormat) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const request = {
    model: "gpt-4-turbo",
    temperature: 0,
    messages,
  };

  if (responseFormat) {
    request.response_format = responseFormat;
  }

  const completion = await openai.chat.completions.create(request);

  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return content.trim();
}

function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Failed to parse OpenAI response:", err, text);
    return fallback;
  }
}

async function handleTransactionInsights(payload) {
  const { transactions = [], region } = payload || {};
  const symbol = currencySymbol(region);
  const summary = transactions
    .map((t) => `${t.description}: ${symbol}${safeNumber(t.amount).toFixed(2)}`)
    .join("\n");

  const content = await callChat(
    [
      {
        role: "system",
        content:
          "You are a financial analysis engine. Always return structured JSON with clear transaction categories, totals, and spending insights.",
      },
      {
        role: "user",
        content: [
          "Analyze the following transactions for high-level behavioural trends.",
          "Return JSON with fields insights (array of {emoji,text}),",
          "subscriptions (array of {name,amount,cancellationUrl}),",
          'and disclaimer with the sentence "This is not financial advice."',
          `Region: ${region}`,
          "Transactions:",
          summary || "No transactions",
        ].join("\n"),
      },
    ],
    { type: "json_object" }
  );

  const parsed = parseJson(content, {
    insights: [],
    subscriptions: [],
    disclaimer: "This is not financial advice.",
  });

  const sanitised = {
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    subscriptions: Array.isArray(parsed.subscriptions)
      ? parsed.subscriptions.map((sub) => ({
          name: sub?.name || "",
          amount: safeNumber(sub?.amount),
          cancellationUrl: sub?.cancellationUrl || "",
        }))
      : [],
    disclaimer:
      typeof parsed.disclaimer === "string"
        ? parsed.disclaimer
        : "This is not financial advice.",
  };

  return sanitised;
}

async function handleBorrowingPower(payload) {
  const { creditScore, totalIncome, totalBalance, region } = payload || {};
  const symbol = currencySymbol(region);

  const content = await callChat(
    [
      {
        role: "system",
        content:
          "You are a financial analysis engine. Always return structured JSON with clear transaction categories, totals, and spending insights.",
      },
      {
        role: "user",
        content: [
          "Provide an informational borrowing power estimate (not advice).",
          'Return JSON with estimatedLoanAmount, estimatedInterestRate, advice, and disclaimer set to "This is not financial advice."',
          `Region: ${region}`,
          `Credit Score: ${creditScore}`,
          `Income: ${symbol}${safeNumber(totalIncome).toFixed(2)}`,
          `Net Worth: ${symbol}${safeNumber(totalBalance).toFixed(2)}`,
        ].join("\n"),
      },
    ],
    { type: "json_object" }
  );

  const parsed = parseJson(content, {
    estimatedLoanAmount: 0,
    estimatedInterestRate: 0,
    advice: "Unable to generate estimation.",
    disclaimer: "This is not financial advice.",
  });

  return {
    estimatedLoanAmount: safeNumber(parsed.estimatedLoanAmount),
    estimatedInterestRate: safeNumber(parsed.estimatedInterestRate),
    advice: parsed.advice || "Unable to generate estimation.",
    disclaimer:
      typeof parsed.disclaimer === "string"
        ? parsed.disclaimer
        : "This is not financial advice.",
  };
}

async function handleFinancialAlerts(payload) {
  const { transactions = [], region } = payload || {};
  const symbol = currencySymbol(region);
  const summary = transactions
    .map(
      (t) =>
        `${t.description}: ${symbol}${safeNumber(t.amount).toFixed(2)} on ${t.date}`
    )
    .join("\n");

  const content = await callChat(
    [
      {
        role: "system",
        content:
          "You are a financial analysis engine. Always return structured JSON with clear transaction categories, totals, and spending insights.",
      },
      {
        role: "user",
        content: [
          "Identify three helpful alerts (anomalies, opportunities, or milestones).",
          'Respond with JSON array of {"type", "title", "description", "disclaimer"}.',
          "Each disclaimer must read \"This is not financial advice.\"",
          "Transactions:",
          summary || "No transactions",
        ].join("\n"),
      },
    ]
  );

  const parsed = parseJson(content, []);
  const alerts = Array.isArray(parsed) ? parsed : parsed?.alerts;

  if (!Array.isArray(alerts)) {
    return [];
  }

  return alerts.map((alert) => ({
    type: alert?.type || "Anomaly",
    title: alert?.title || "Check activity",
    description: alert?.description || "We could not generate details.",
    disclaimer:
      typeof alert?.disclaimer === "string"
        ? alert.disclaimer
        : "This is not financial advice.",
  }));
}

async function handleBalanceForecast(payload) {
  const { transactions = [], currentBalance, potentialMonthlySavings, region } =
    payload || {};
  const symbol = currencySymbol(region);
  const summary = transactions
    .slice(0, 50)
    .map((t) => {
      const direction = safeNumber(t.amount) >= 0 ? "Income" : "Expense";
      return `${t.date}: ${direction} ${symbol}${Math.abs(safeNumber(t.amount)).toFixed(
        2
      )} (${t.description})`;
    })
    .join("\n");

  const content = await callChat(
    [
      {
        role: "system",
        content:
          "You are a financial analysis engine. Always return structured JSON with clear transaction categories, totals, and spending insights.",
      },
      {
        role: "user",
        content: [
          "Create a six month balance forecast comparing current behaviour versus optimized behaviour.",
          'Return JSON with forecastData (array of {month, defaultForecast, optimizedForecast}), insight, keyChanges (array of {description}), and disclaimer "This is not financial advice."',
          `Current balance: ${symbol}${safeNumber(currentBalance).toFixed(2)}`,
          `Potential monthly savings: ${symbol}${safeNumber(
            potentialMonthlySavings
          ).toFixed(2)}`,
          "Recent transactions:",
          summary || "No transactions",
        ].join("\n"),
      },
    ],
    { type: "json_object" }
  );

  const parsed = parseJson(content, {
    forecastData: [],
    insight: "Unable to generate forecast.",
    keyChanges: [],
    disclaimer: "This is not financial advice.",
  });

  const forecastData = Array.isArray(parsed.forecastData)
    ? parsed.forecastData.map((entry) => ({
        month: entry?.month || "",
        defaultForecast: safeNumber(entry?.defaultForecast),
        optimizedForecast: safeNumber(entry?.optimizedForecast),
      }))
    : [];

  return {
    forecastData,
    insight: parsed.insight || "Unable to generate forecast.",
    keyChanges: Array.isArray(parsed.keyChanges)
      ? parsed.keyChanges.map((change) => ({
          description: change?.description || "",
        }))
      : [],
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

  const { action, payload } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: "Missing action" });
  }

  try {
    let result;
    switch (action) {
      case "transaction-insights":
        result = await handleTransactionInsights(payload);
        break;
      case "borrowing-power":
        result = await handleBorrowingPower(payload);
        break;
      case "financial-alerts":
        result = await handleFinancialAlerts(payload);
        break;
      case "balance-forecast":
        result = await handleBalanceForecast(payload);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ OpenAI handler error:", error);
    res.status(500).json({ error: error?.message || "AI request failed" });
  }
}
