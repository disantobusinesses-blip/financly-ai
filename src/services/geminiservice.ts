// FIX: Using new GoogleGenAI SDK and correct model
import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import new types for Investment Advisor
import { Transaction, FinancialAlert, SavingsPlan, SpendingForecastResult, Goal, BalanceForecastResult, Account, AccountType, User, RiskTolerance, InvestmentAdvice } from '../types';
import { getCurrencyInfo } from '../utils/currency';

// Ensure API_KEY is available in the environment variables
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY for Gemini is not set in environment variables.");
}

// FIX: Initialize with named parameter and use new GoogleGenAI
const ai = new GoogleGenAI({ apiKey: API_KEY });
// FIX: Use allowed model 'gemini-2.5-flash'
const model = 'gemini-2.5-flash';

// Define the expected JSON structure for our new features
export interface TransactionAnalysisResult {
    insights: { emoji: string; text: string }[];
    subscriptions: { name: string; amount: number }[];
}

export interface BorrowingPowerResult {
    estimatedLoanAmount: number;
    estimatedInterestRate: number;
    advice: string;
}


/**
 * Analyzes transactions to find spending insights and recurring subscriptions.
 * @param transactions A list of user transactions.
 * @param region The user's region ('AU' or 'US').
 * @returns A structured object with insights and subscriptions.
 */
export const getTransactionInsights = async (transactions: Transaction[], region: User['region']): Promise<TransactionAnalysisResult> => {
    const { symbol } = getCurrencyInfo(region);
    const transactionSummary = transactions.map(t => `${t.description}: ${symbol}${t.amount.toFixed(2)}`).join('\n');

    const prompt = `
        You are a financial analyst for a ${region === 'US' ? 'US-based' : 'Australian'} user. Analyze the following transactions and provide insights.
        Your Task:
        1.  **Spending Insights:** Identify 3 interesting patterns or potential savings opportunities.
        2.  **Subscription Hunter:** Identify all clear recurring payments.
        Return your response as a valid JSON object. Do not include any text outside of the JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
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
                                    emoji: { type: Type.STRING, description: "An emoji to represent the insight." },
                                    text: { type: Type.STRING, description: "The insight text." },
                                },
                                required: ["emoji", "text"],
                            },
                        },
                        subscriptions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "The name of the subscription." },
                                    amount: { type: Type.NUMBER, description: "The monthly cost of the subscription." },
                                },
                                required: ["name", "amount"],
                            },
                        },
                    },
                    required: ["insights", "subscriptions"],
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as TransactionAnalysisResult;
        
    } catch (error) {
        console.error("Error calling Gemini API for transaction insights:", error);
        throw new Error("Failed to get transaction analysis from the AI assistant.");
    }
};


/**
 * Calculates borrowing power based on user's financial data.
 * @param creditScore The user's credit score.
 * @param totalIncome The user's total monthly income.
 * @param totalBalance The user's total net worth.
 * @param region The user's region ('AU' or 'US').
 * @returns A structured object with borrowing power analysis.
 */
export const getBorrowingPower = async (creditScore: number, totalIncome: number, totalBalance: number, region: User['region']): Promise<BorrowingPowerResult> => {
    const { symbol, code } = getCurrencyInfo(region);
    const creditScoreContext = region === 'US'
        ? `Credit Score: ${creditScore} (out of 850). In the US, a score above 740 is very good, and above 800 is excellent.`
        : `Credit Score: ${creditScore} (out of 1000). In Australia, a score above 700 is very good, and a score above 800 is excellent.`;
    
    const prompt = `
        You are an expert loan officer AI for a ${region === 'US' ? 'US-based' : 'Australian'} customer. Analyze the following user financial data to estimate their borrowing power for a personal loan.

        **User Data:**
        - ${creditScoreContext}
        - Total Monthly Income: ${symbol}${totalIncome.toFixed(2)}
        - Total Net Worth (Savings/Assets): ${symbol}${totalBalance.toFixed(2)}

        **Your Task:**
        Based on this data, provide an estimated maximum personal loan amount and a typical interest rate. Also, provide one sentence of concise advice. A higher credit score and income should result in a higher loan amount and a lower interest rate. 

        Return your response as a valid JSON object. Do not include any text outside of the JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        estimatedLoanAmount: {
                            type: Type.NUMBER,
                            description: `The estimated maximum personal loan amount in ${code}.`
                        },
                        estimatedInterestRate: {
                            type: Type.NUMBER,
                            description: "The estimated annual interest rate as a percentage."
                        },

                        advice: {
                            type: Type.STRING,
                            description: "A single sentence of personalized advice."
                        }
                    },
                    required: ["estimatedLoanAmount", "estimatedInterestRate", "advice"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as BorrowingPowerResult;

    } catch (error) {
        console.error("Error calling Gemini API for borrowing power:", error);
        throw new Error("Failed to get borrowing power analysis from the AI.");
    }
}

/**
 * Acts as a "Financial Watchdog" to find anomalies, opportunities, and milestones.
 * @param transactions A list of user transactions.
 * @param region The user's region ('AU' or 'US').
 * @returns A list of structured FinancialAlert objects.
 */
export const getFinancialAlerts = async (transactions: Transaction[], region: User['region']): Promise<FinancialAlert[]> => {
    const { symbol } = getCurrencyInfo(region);
    const transactionSummary = transactions.map(t => `${t.description}: ${symbol}${t.amount.toFixed(2)} on ${t.date}`).join('\n');
    
    const prompt = `
        You are an AI Financial Watchdog for a ${region === 'US' ? 'US-based' : 'Australian'} user. Your task is to analyze a list of transactions and identify important alerts.
        
        Analyze these transactions:
        ${transactionSummary}

        Identify up to 3 alerts from the following categories:
        1.  **Anomaly:** A potential duplicate charge, or an unusually high bill compared to averages (e.g., electricity, internet).
        2.  **Opportunity:** A recurring bill (e.g., phone, internet, subscription) that could be negotiated for a better price. For these, your description MUST include:
            a. A suggestion to contact the provider to ask for a loyalty discount.
            b. A realistic success rate for negotiation (e.g., "around 60% of customers who ask for a better price are successful").
            c. An estimated potential annual saving. For example, "a 10% discount could save you over ${symbol}20 per year."
        3.  **Milestone:** A positive achievement, like a new high in a savings account (though you can't see balances, infer from large positive transactions) or a large payment towards a credit card.

        Return a JSON array of alert objects. Do not include any text outside the JSON array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: {
                                type: Type.STRING,
                                description: "The type of alert: 'Anomaly', 'Opportunity', or 'Milestone'."
                            },
                            title: {
                                type: Type.STRING,
                                description: "A short, catchy title for the alert."
                            },
                            description: {
                                type: Type.STRING,
                                description: "A one-sentence description of the alert, following the specific instructions for the 'Opportunity' type."
                            }
                        },
                        required: ["type", "title", "description"]
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as FinancialAlert[];

    } catch (error) {
        console.error("Error calling Gemini API for financial alerts:", error);
        return [];
    }
};

/**
 * Generates a savings plan by analyzing expenses against a goal.
 * @param transactions A list of user transactions.
 * @param goal The user's primary savings goal.
 * @param accounts A list of user's bank accounts.
 * @param region The user's region ('AU' or 'US').
 * @returns A structured SavingsPlan object.
 */
export const getSavingsPlan = async (transactions: Transaction[], goal: Goal, accounts: Account[], region: User['region']): Promise<SavingsPlan> => {
    const { symbol } = getCurrencyInfo(region);
    const expenseSummary = transactions
        .filter(t => t.amount < 0)
        .map(t => `${t.category} - ${t.description}: ${symbol}${Math.abs(t.amount).toFixed(2)}`)
        .join('\n');

    const totalExpenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const monthlyExpenses = totalExpenses / 3;

    const accountSummary = accounts
      .filter(a => a.type !== AccountType.CREDIT_CARD)
      .map(a => `${a.name} (${a.type}): ${symbol}${a.balance.toFixed(2)}`)
      .join('\n');
    
    const prompt = `
        You are an AI Savings Coach for a ${region === 'US' ? 'US-based' : 'Australian'} user. Their primary goal is to save ${symbol}${goal.targetAmount} for "${goal.name}" by ${goal.targetDate}. They have currently saved ${symbol}${goal.currentAmount}.
        The current date is ${new Date().toISOString().split('T')[0]}.
        
        Analyze their financial situation:

        Account Balances:
        ${accountSummary}

        Recent Expenses:
        ${expenseSummary}

        Your Task is to create a comprehensive savings plan with two types of suggestions:
        1.  **Capital Management (Priority 1):** Analyze the account balances. A large sum of money should not sit in a low-interest 'Chequing' or 'Checking' account.
            *   If you see this pattern, create a suggestion to move funds to the 'High-Yield Savings' account.
            *   Calculate a buffer to keep in the chequing account (roughly 1.5 times the average monthly expenses, which is ~${symbol}${monthlyExpenses.toFixed(2)}).
            *   For this suggestion, the 'category' field MUST be "Capital Growth".
            *   The 'monthlyCut' field for this suggestion MUST be a POSITIVE number representing the estimated monthly interest earned. Assume the savings account earns 4.5% p.a. interest, compounded monthly. (Monthly interest = (Amount Moved * 0.045) / 12).
            *   The suggestion description should be "Move [Calculated Amount] to your high-yield savings to start earning interest."
        2.  **Expense Reduction (Priority 2):** Identify 1-2 specific, actionable suggestions for cutting monthly expenses from the list. For these, 'monthlyCut' is the positive amount saved. For example, suggest cancelling ONE streaming service (e.g., Netflix or Stan) or reducing 'Food & Dining'.
        3.  Calculate the total monthly savings from ALL suggestions by summing the \`monthlyCut\` values from both capital growth (interest) and expense cuts.
        4.  Based on the total monthly savings, calculate the new projected date they will reach their goal.
        5.  Calculate the total number of months they will save compared to their original plan.

        Return a valid JSON object. Do not include any text outside the JSON object.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING },
                                    monthlyCut: { type: Type.NUMBER },
                                    description: { type: Type.STRING }
                                },
                                required: ["category", "monthlyCut", "description"]
                            }
                        },
                        totalMonthlySavings: { type: Type.NUMBER },
                        newGoalDate: { type: Type.STRING, description: "The new projected date in YYYY-MM-DD format." },
                        monthsSaved: { type: Type.NUMBER, description: "The number of months saved." }
                    },
                    required: ["suggestions", "totalMonthlySavings", "newGoalDate", "monthsSaved"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SavingsPlan;
        
    } catch(error) {
        console.error("Error calling Gemini API for savings plan:", error);
        throw new Error("Failed to get savings plan from the AI assistant.");
    }
};


/**
 * Generates a 6-month balance forecast.
 * @param transactions A list of user transactions.
 * @param currentBalance The user's current total balance.
 * @param potentialMonthlySavings The potential extra savings from the AI plan.
 * @param region The user's region ('AU' or 'US').
 * @returns A structured BalanceForecastResult object.
 */
export const getBalanceForecast = async (transactions: Transaction[], currentBalance: number, potentialMonthlySavings: number, region: User['region']): Promise<BalanceForecastResult> => {
    const { symbol } = getCurrencyInfo(region);
    const transactionSummary = transactions
        .map(t => `${t.date}: ${t.amount > 0 ? 'Income' : 'Expense'} of ${symbol}${Math.abs(t.amount).toFixed(2)} for ${t.description}`)
        .slice(0, 50)
        .join('\n');

    const prompt = `
        You are a financial forecasting AI for a ${region === 'US' ? 'US-based' : 'Australian'} user. Your task is to project their account balance over the next 6 months.

        User's Financial Data:
        - Current Total Balance: ${symbol}${currentBalance.toFixed(2)}
        - Recent Transaction Patterns (Income & Expenses):
          ${transactionSummary}
        - Potential Additional Monthly Savings (from an AI savings plan that includes both expense cuts AND new interest earned): ${symbol}${potentialMonthlySavings.toFixed(2)}

        Your Task:
        1.  **Default Forecast:** Based on the transaction patterns, project the user's likely month-end balance for each of the next 6 months, starting from the current balance. This forecast should assume their money stays in its current accounts and does NOT earn significant interest.
        2.  **Optimized Forecast:** Project the user's month-end balance for each of the next 6 months. This forecast is what happens if the user follows the AI savings plan. To calculate it:
            a. Start with the current balance.
            b. Each month, calculate the balance as if they followed their normal income/expense patterns BUT ALSO added the "Potential Additional Monthly Savings" on top.
            c. This means the optimized forecast will grow significantly faster than the default forecast due to BOTH reduced spending AND new interest income being added every month. The difference should be dramatic to show the user the benefit.
        3.  **Insight:** Provide a single, compelling sentence that highlights the long-term benefit of the optimized plan, mentioning the total difference after 6 months.
        4.  **Key Changes:** List the top 2-3 specific actions from the savings plan that contribute most to the optimized forecast. **This MUST include the action of moving funds to a high-yield savings account if applicable.** Examples: 'Move $15,000 to high-yield savings', 'Cancel Stan subscription'.

        Return a valid JSON object. The 'forecastData' array must contain exactly 6 items, one for each of the next 6 months. The month names should be short (e.g., 'Aug', 'Sep'). The 'keyChanges' array should list the actions.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        forecastData: {
                            type: Type.ARRAY,
                            description: "An array of 6 forecast data points, one for each month.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    month: { type: Type.STRING, description: "The abbreviated month name (e.g., 'Sep')." },
                                    defaultForecast: { type: Type.NUMBER, description: "The projected balance with current habits." },
                                    optimizedForecast: { type: Type.NUMBER, description: "The projected balance with extra savings." }
                                },
                                required: ["month", "defaultForecast", "optimizedForecast"]
                            }
                        },
                        insight: {
                            type: Type.STRING,
                            description: "A single sentence insight comparing the two forecasts."
                        },
                        keyChanges: {
                            type: Type.ARRAY,
                            description: "A list of the key actions driving the optimized forecast.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING, description: "A short description of the saving action." }
                                },
                                required: ["description"]
                            }
                        }
                    },
                    required: ["forecastData", "insight", "keyChanges"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as BalanceForecastResult;

    } catch (error) {
        console.error("Error calling Gemini API for balance forecast:", error);
        throw new Error("Failed to get balance forecast from the AI assistant.");
    }
};

// FIX: Add missing function for AI Investment Advisor
/**
 * Generates personalized investment advice based on user's accounts and risk tolerance.
 * @param accounts A list of user's bank accounts.
 * @param riskTolerance The user's chosen risk tolerance.
 * @param region The user's region ('AU' or 'US').
 * @returns A structured InvestmentAdvice object.
 */
export const getInvestmentAdvice = async (accounts: Account[], riskTolerance: RiskTolerance, region: User['region']): Promise<InvestmentAdvice> => {
    const { symbol } = getCurrencyInfo(region);

    // Calculate the total amount available for investment from savings accounts.
    const investableAssets = accounts
        .filter(a => a.type === AccountType.SAVINGS)
        .reduce((sum, acc) => sum + acc.balance, 0);

    const prompt = `
        You are an AI Investment Advisor for a ${region === 'US' ? 'US-based' : 'Australian'} user.
        Their financial situation:
        - Total investable assets (from savings accounts): ${symbol}${investableAssets.toFixed(2)}
        - Chosen risk tolerance: ${riskTolerance}

        Your Task:
        1.  Based on the user's risk tolerance and region, suggest a diversified investment portfolio.
        2.  The portfolio should be returned as an array of allocation objects, each with a 'name' (e.g., '${region === 'US' ? 'US Equities' : 'Australian Shares (ASX 200)'}', 'International Equities', 'Bonds', 'Cash/High-Interest Savings') and a 'percentage'.
        3.  The percentages for all allocations MUST sum to 100.
        4.  Provide a concise, one or two-sentence 'rationale' explaining why this portfolio is suitable for a '${riskTolerance}' investor in ${region}. For example, a conservative portfolio should have more bonds and cash, while an aggressive one should have more equities.

        Return a valid JSON object. Do not include any text outside the JSON object.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        allocation: {
                            type: Type.ARRAY,
                            description: "An array of investment allocations. The percentages must sum to 100.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "The name of the asset class." },
                                    percentage: { type: Type.NUMBER, description: "The percentage allocated to this asset class." }
                                },
                                required: ["name", "percentage"]
                            }
                        },
                        rationale: {
                            type: Type.STRING,
                            description: "A short rationale explaining the portfolio strategy."
                        }
                    },
                    required: ["allocation", "rationale"]
                }
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as InvestmentAdvice;

        // Basic validation
        const totalPercentage = result.allocation.reduce((sum, item) => sum + item.percentage, 0);
        if (Math.round(totalPercentage) !== 100) {
            console.warn(`Gemini API returned an allocation that does not sum to 100%. Total: ${totalPercentage}%`);
        }
        
        return result;
        
    } catch (error) {
        console.error("Error calling Gemini API for investment advice:", error);
        throw new Error("Failed to get investment advice from the AI assistant.");
    }
};
