// src/components/Dashboard.tsx
import { useMemo, useState } from "react";

import BalanceSummary from "./BalanceSummary";
import CashflowMini from "./CashflowMini";
import SpendingByCategory from "./SpendingByCategory";
import SpendingChart from "./SpendingChart";
import UpcomingBills from "./UpcomingBills";
import SpendingForecast from "./SpendingForecast";
import FinancialAlerts from "./FinancialAlerts";
import TransactionsList from "./TransactionsList";
import TransactionAnalysis from "./TransactionAnalysis";
import FinancialWellnessScore from "./FinancialWellnessScore";
import SubscriptionHunter from "./SubscriptionHunter";
import SavingsCoach from "./SavingsCoach";
import GoalPlanner from "./GoalPlanner";
import DashboardTour from "./DashboardTour";
import PlanGate from "./PlanGate";
import { MagnifierIcon } from "./icon/Icon";
import { useBasiqData } from "../hooks/useBasiqData";
import { useAuth } from "../contexts/AuthContext";
import { useGeminiAI } from "../hooks/useGeminiAI";
import { formatCurrency } from "../utils/currency";

export default function Dashboard() {
  const { user } = useAuth();
  const basiqUserKey = user?.email?.trim().toLowerCase() || undefined;
  const { accounts, transactions, loading, error, lastUpdated } =
    useBasiqData(basiqUserKey);
  const [tourSignal, setTourSignal] = useState(0);
  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );
  const {
    alerts: aiAlerts,
    insights: aiInsights,
    loading: aiLoading,
    error: aiError,
  } = useGeminiAI(transactions, totalBalance, user?.region ?? "AU");
  const goalSuggestions = aiInsights?.insights ?? [];
  const region = user?.region ?? "AU";
  const isBasic = user?.membershipType === "Basic";
  const basicTrialEndsAt = user?.basicTrialEndsAt;
  const trialExpired =
    isBasic && basicTrialEndsAt
      ? new Date(basicTrialEndsAt).getTime() <= Date.now()
      : false;
  const upgradeFootnote = trialExpired
    ? "Your 7-day showcase has ended. Upgrade to My Finances Pro to keep exploring live analytics."
    : "Upgrade to My Finances Pro to remove the blur and unlock every insight instantly.";

  const thirtyDayMetrics = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime());
    start.setDate(now.getDate() - 30);

    const categoryTotals = new Map<string, number>();
    let income = 0;
    let expenses = 0;

    for (const txn of transactions) {
      const parsed = new Date(txn.date);
      if (Number.isNaN(parsed.getTime()) || parsed < start || parsed > now) {
        continue;
      }

      const amount = Number(txn.amount) || 0;
      if (amount > 0) {
        income += amount;
      } else if (amount < 0) {
        const spend = Math.abs(amount);
        expenses += spend;
        const category = txn.category || "General Spending";
        categoryTotals.set(
          category,
          (categoryTotals.get(category) ?? 0) + spend
        );
      }
    }

    let topCategoryName: string | null = null;
    let topCategoryAmount = 0;
    for (const [category, total] of categoryTotals.entries()) {
      if (total > topCategoryAmount) {
        topCategoryName = category;
        topCategoryAmount = total;
      }
    }

    const potentialMonthlySavings = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .reduce((sum, [, total]) => sum + total * 0.15, 0);

    return {
      income,
      expenses,
      netCashflow: income - expenses,
      categoryTotals,
      topCategoryName,
      topCategoryAmount,
      potentialMonthlySavings,
    };
  }, [transactions]);

  const subscriptionSummary = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number; count: number }
    >();

    transactions.forEach((txn) => {
      if (txn.category !== "Subscriptions") return;
      const descriptor = txn.description?.trim() || txn.id;
      const key = descriptor.toLowerCase();
      const amount = Math.abs(Number(txn.amount) || 0);
      if (map.has(key)) {
        const entry = map.get(key)!;
        map.set(key, {
          name: entry.name,
          total: entry.total + amount,
          count: entry.count + 1,
        });
      } else {
        map.set(key, { name: descriptor, total: amount, count: 1 });
      }
    });

    let topName = "";
    let topAmount = 0;
    map.forEach((entry) => {
      if (entry.total > topAmount) {
        topAmount = entry.total;
        topName = entry.name;
      }
    });

    return {
      uniqueCount: map.size,
      totalAmount: Array.from(map.values()).reduce(
        (sum, entry) => sum + entry.total,
        0
      ),
      topName,
      topAmount,
    };
  }, [transactions]);

  const upcomingBills = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime());
    horizon.setDate(now.getDate() + 30);

    let count = 0;
    let total = 0;

    transactions.forEach((txn) => {
      if (txn.category !== "Bills") return;
      const parsed = new Date(txn.date);
      if (Number.isNaN(parsed.getTime())) return;
      const amount = Math.abs(Number(txn.amount) || 0);
      if (parsed >= now && parsed <= horizon) {
        count += 1;
        total += amount;
      }
    });

    if (count === 0) {
      const start = new Date(now.getTime());
      start.setDate(now.getDate() - 30);
      transactions.forEach((txn) => {
        if (txn.category !== "Bills") return;
        const parsed = new Date(txn.date);
        if (Number.isNaN(parsed.getTime()) || parsed < start || parsed > now)
          return;
        count += 1;
        total += Math.abs(Number(txn.amount) || 0);
      });
    }

    return { count, total };
  }, [transactions]);

  const netCashflow = thirtyDayMetrics.netCashflow;
  const topCategoryName = thirtyDayMetrics.topCategoryName;
  const topCategoryAmount = thirtyDayMetrics.topCategoryAmount;
  const categoryCount = thirtyDayMetrics.categoryTotals.size;
  const potentialMonthlySavings = thirtyDayMetrics.potentialMonthlySavings;
  const totalIncome = thirtyDayMetrics.income;
  const totalExpenses = thirtyDayMetrics.expenses;
  const aiAlertCount = aiAlerts.length;
  const aiInsightCount = goalSuggestions.length;
  const transactionCount = transactions.length;

  type GateCopy = {
    headline: string;
    message: string;
    highlight?: string;
    footnote?: string;
  };

  const gateMessages: Partial<Record<string, GateCopy>> = useMemo(() => {
    if (!isBasic) return {};

    const baseFootnote = upgradeFootnote;

    const subscriptionHeadline =
      subscriptionSummary.uniqueCount > 0
        ? `We found ${subscriptionSummary.uniqueCount} subscription${
            subscriptionSummary.uniqueCount === 1 ? "" : "s"
          } on repeat`
        : "Subscription Hunter is ready";
    const subscriptionMessage =
      subscriptionSummary.uniqueCount > 0
        ? "Upgrade to see merchant names, renewal dates, and one-tap cancel tips for each recurring charge."
        : "Sync a few more transactions and Subscription Hunter will expose duplicate memberships instantly.";
    const subscriptionHighlight =
      subscriptionSummary.totalAmount > 0
        ? `Potential savings: ${formatCurrency(
            subscriptionSummary.totalAmount,
            region
          )} / month`
        : undefined;

    const cashflowHeadline =
      netCashflow >= 0 ? "Positive cashflow trend spotted" : "Cashflow needs attention";
    const cashflowMessage =
      netCashflow >= 0
        ? "Upgrade to break the surplus down by week and redirect it into goals automatically."
        : "Upgrade to see daily patterns, AI nudges, and spending caps to rebound above zero.";
    const cashflowHighlight =
      totalIncome || totalExpenses
        ? `Income ${formatCurrency(totalIncome, region)} · Spend ${formatCurrency(
            -Math.abs(totalExpenses),
            region
          )}`
        : undefined;

    const categoryHeadline =
      topCategoryName && topCategoryAmount > 0
        ? `${topCategoryName} is leading your spend`
        : "Top categories ready to review";
    const categoryMessage =
      topCategoryName && topCategoryAmount > 0
        ? "Upgrade to drill into every transaction feeding this category and set caps before it grows."
        : "Upgrade to unlock category-level insights as more transactions sync.";
    const categoryHighlight =
      topCategoryAmount > 0
        ? `${topCategoryName ?? "Top category"}: ${formatCurrency(
            topCategoryAmount,
            region
          )}`
        : undefined;

    const shareMessage = `We've grouped your spending into ${categoryCount} categories. Upgrade to compare percentages and track month-over-month changes.`;

    const savingsHeadline =
      potentialMonthlySavings > 0
        ? "Savings Coach found quick wins"
        : "Savings Coach is ready for more data";
    const savingsMessage =
      potentialMonthlySavings > 0
        ? "Upgrade to unlock personalised challenges and weekly nudges tailored to your biggest spend buckets."
        : "Upgrade to let Savings Coach analyse deeper once more history syncs.";
    const savingsHighlight =
      potentialMonthlySavings > 0
        ? `Potential monthly savings: ${formatCurrency(
            potentialMonthlySavings,
            region
          )}`
        : undefined;

    const forecastHeadline =
      aiInsightCount > 0
        ? "AI forecast prepared tailored suggestions"
        : "Forecast ready for your first projections";
    const forecastMessage =
      aiInsightCount > 0
        ? "Upgrade to reveal Gemini's balance projections, optimisation path, and neutral disclaimers for each insight."
        : "Upgrade to unlock AI-powered forecasting as soon as more activity syncs.";
    const forecastHighlight =
      netCashflow !== 0
        ? `30-day trend: ${formatCurrency(netCashflow, region)}`
        : aiInsightCount > 0
        ? `AI tips waiting: ${aiInsightCount}`
        : undefined;

    const alertsHeadline =
      aiAlertCount > 0
        ? "Gemini flagged opportunities"
        : "Alerts will light up as soon as we spot something";
    const alertsMessage =
      aiAlertCount > 0
        ? "Upgrade to read each alert with supporting stats and clear \"This is not Financial advice.\" reminders."
        : "Upgrade to enable proactive alerts the moment spending shifts or savings appear.";
    const alertsHighlight =
      aiAlertCount > 0 ? `Alerts queued: ${aiAlertCount}` : undefined;

    const billsHeadline =
      upcomingBills.count > 0
        ? "Upcoming bills detected"
        : "We'll watch for upcoming bills";
    const billsMessage =
      upcomingBills.count > 0
        ? "Upgrade to view due dates, merchants, and recommended actions to avoid late fees."
        : "Upgrade to let Financly project bill schedules as soon as we see repeating charges.";
    const billsHighlight =
      upcomingBills.total > 0
        ? `Next 30 days: ${formatCurrency(upcomingBills.total, region)}`
        : undefined;

    const analysisHeadline =
      aiInsightCount > 0
        ? "AI analysis waiting"
        : "Analysis unlocks when you upgrade";
    const analysisMessage =
      aiInsightCount > 0
        ? "Upgrade to read Gemini's neutral summaries, category stats, and savings ideas personalised to you."
        : "Upgrade to let Gemini break down your transactions with context and stats.";
    const analysisHighlight =
      aiInsightCount > 0 ? `AI insights ready: ${aiInsightCount}` : undefined;

    return {
      subscription: {
        headline: subscriptionHeadline,
        message: subscriptionMessage,
        highlight: subscriptionHighlight,
        footnote: baseFootnote,
      },
      forecast: {
        headline: forecastHeadline,
        message: forecastMessage,
        highlight: forecastHighlight,
        footnote: baseFootnote,
      },
      cashflow: {
        headline: cashflowHeadline,
        message: cashflowMessage,
        highlight: cashflowHighlight,
        footnote: baseFootnote,
      },
      category: {
        headline: categoryHeadline,
        message: categoryMessage,
        highlight: categoryHighlight,
        footnote: baseFootnote,
      },
      share: {
        headline: "Spending mix preview",
        message: shareMessage,
        highlight: `Categories tracked: ${categoryCount}`,
        footnote: baseFootnote,
      },
      savings: {
        headline: savingsHeadline,
        message: savingsMessage,
        highlight: savingsHighlight,
        footnote: baseFootnote,
      },
      alerts: {
        headline: alertsHeadline,
        message: alertsMessage,
        highlight: alertsHighlight,
        footnote: baseFootnote,
      },
      bills: {
        headline: billsHeadline,
        message: billsMessage,
        highlight: billsHighlight,
        footnote: baseFootnote,
      },
      transactions: {
        headline: "Live transactions synced",
        message:
          "Upgrade to scroll every transaction, filter by category, and annotate spend in real time.",
        highlight: `Entries synced: ${transactionCount}`,
        footnote: baseFootnote,
      },
      analysis: {
        headline: analysisHeadline,
        message: analysisMessage,
        highlight: analysisHighlight,
        footnote: baseFootnote,
      },
    };
  }, [
    isBasic,
    upgradeFootnote,
    subscriptionSummary,
    region,
    netCashflow,
    totalIncome,
    totalExpenses,
    topCategoryName,
    topCategoryAmount,
    categoryCount,
    potentialMonthlySavings,
    aiInsightCount,
    aiAlertCount,
    upcomingBills,
    transactionCount,
  ]);

  const renderWithGate = (key: string, element: JSX.Element) => {
    if (!isBasic) return element;
    const copy = gateMessages[key];
    if (!copy) return element;
    return (
      <PlanGate
        locked
        headline={copy.headline}
        message={copy.message}
        highlight={copy.highlight}
        footnote={copy.footnote}
      >
        {element}
      </PlanGate>
    );
  };

  const aiStatusMessage = useMemo(() => {
    if (aiLoading) {
      return "Generating AI insights...";
    }

    if (aiError) {
      return `AI enhancements unavailable: ${aiError}`;
    }

    const suggestionCount = aiInsights?.insights?.length ?? 0;
    const alertCount = aiAlerts.length;

    if (suggestionCount > 0 || alertCount > 0) {
      const suggestionLabel = suggestionCount === 1 ? "suggestion" : "suggestions";
      const alertLabel = alertCount === 1 ? "alert" : "alerts";

      return `AI insights ready with ${suggestionCount} ${suggestionLabel} and ${alertCount} ${alertLabel}.`;
    }

    return "AI enhancements ready.";
  }, [aiAlerts, aiError, aiInsights, aiLoading]);

  if (loading && accounts.length > 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-gray-500">
        <p>Refreshing your live financial data...</p>
        {lastUpdated && (
          <p className="mt-2 text-xs text-gray-400">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  if (loading && accounts.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-gray-500">
        <p>Loading your financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-red-500">
        <p>Failed to load data: {error}</p>
      </div>
    );
  }

  if (accounts.length === 0 && transactions.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-gray-500">
        <p>No data yet. Connect your bank to see your dashboard.</p>
      </div>
    );
  }

  const primarySections = [
    {
      key: "financial-wellness",
      tourId: "financial-wellness-card",
      id: "financial-wellness",
      content: (
        <FinancialWellnessScore
          accounts={accounts}
          transactions={transactions}
        />
      ),
    },
    {
      key: "goal-planner",
      tourId: "goal-planner",
      id: "goal-planner",
      content: (
        <GoalPlanner
          accounts={accounts}
          transactions={transactions}
          aiSuggestions={goalSuggestions}
        />
      ),
    },
  ];

  const mobilePanels = [
    {
      key: "balance",
      id: "balance-summary-card",
      node: <BalanceSummary accounts={accounts} />,
    },
    {
      key: "subscription",
      id: "subscription-hunter-card",
      node: <SubscriptionHunter transactions={transactions} />,
    },
    {
      key: "forecast",
      id: "spending-forecast-card",
      node: (
        <SpendingForecast
          transactions={transactions}
          totalBalance={totalBalance}
          savingsPlan={null}
        />
      ),
    },
    {
      key: "cashflow",
      id: "cashflow-mini-card",
      node: <CashflowMini transactions={transactions} />,
    },
    {
      key: "category",
      id: "spending-by-category-card",
      node: <SpendingByCategory transactions={transactions} />,
    },
    {
      key: "share",
      id: "spending-chart-card",
      node: <SpendingChart transactions={transactions} />,
    },
    {
      key: "savings",
      id: "savings-coach-card",
      node: <SavingsCoach transactions={transactions} />,
    },
    {
      key: "alerts",
      id: "financial-alerts-card",
      node: <FinancialAlerts transactions={transactions} />,
    },
    {
      key: "bills",
      id: "upcoming-bills-card",
      node: <UpcomingBills transactions={transactions} />,
    },
    {
      key: "transactions",
      id: "transactions-card",
      node: <TransactionsList transactions={transactions} />,
    },
    {
      key: "analysis",
      id: "transaction-analysis-card",
      node: <TransactionAnalysis transactions={transactions} />,
    },
  ];

  const triggerTour = () => {
    setTourSignal((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 px-4 pb-10 pt-4 sm:px-6">
      <DashboardTour enabled={accounts.length > 0} restartSignal={tourSignal} />
      {accounts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-30">
          <button
            type="button"
            onClick={triggerTour}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-white"
          >
            <MagnifierIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Need a tour?</span>
            <span className="sm:hidden">Tour</span>
          </button>
        </div>
      )}
      {primarySections.map((section) => (
        <section
          key={section.key}
          id={section.id}
          data-tour-id={section.tourId}
          data-tour-variant="shared"
        >
          {section.content}
        </section>
      ))}

      <div className="-mx-4 md:hidden">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
          {mobilePanels.map((panel) => (
            <div
              key={panel.key}
              className="min-w-[85vw] snap-center"
              data-tour-id={panel.id}
              data-tour-variant="mobile"
            >
              {renderWithGate(panel.key, panel.node)}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:flex md:flex-col md:gap-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <div
              id="balance-summary"
              data-tour-id="balance-summary-card"
              data-tour-variant="desktop"
            >
              <BalanceSummary accounts={accounts} />
            </div>
            <div data-tour-id="spending-forecast-card" data-tour-variant="desktop">
              {renderWithGate(
                "forecast",
                <SpendingForecast
                  transactions={transactions}
                  totalBalance={totalBalance}
                  savingsPlan={null}
                />
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div
              id="subscription-hunter"
              data-tour-id="subscription-hunter-card"
              data-tour-variant="desktop"
            >
              {renderWithGate(
                "subscription",
                <SubscriptionHunter transactions={transactions} />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div data-tour-id="cashflow-mini-card" data-tour-variant="desktop">
            {renderWithGate(
              "cashflow",
              <CashflowMini transactions={transactions} />
            )}
          </div>
          <div data-tour-id="savings-coach-card" data-tour-variant="desktop">
            {renderWithGate(
              "savings",
              <SavingsCoach transactions={transactions} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div data-tour-id="spending-by-category-card" data-tour-variant="desktop">
            {renderWithGate(
              "category",
              <SpendingByCategory transactions={transactions} />
            )}
          </div>
          <div data-tour-id="spending-chart-card" data-tour-variant="desktop">
            {renderWithGate(
              "share",
              <SpendingChart transactions={transactions} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div data-tour-id="upcoming-bills-card" data-tour-variant="desktop">
            {renderWithGate(
              "bills",
              <UpcomingBills transactions={transactions} />
            )}
          </div>
          <div data-tour-id="financial-alerts-card" data-tour-variant="desktop">
            {renderWithGate(
              "alerts",
              <FinancialAlerts transactions={transactions} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div data-tour-id="transactions-card" data-tour-variant="desktop">
            {renderWithGate(
              "transactions",
              <TransactionsList transactions={transactions} />
            )}
          </div>
          <div data-tour-id="transaction-analysis-card" data-tour-variant="desktop">
            {renderWithGate(
              "analysis",
              <TransactionAnalysis transactions={transactions} />
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">{aiStatusMessage}</div>

      {lastUpdated && (
        <div className="text-center text-xs text-slate-400">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
