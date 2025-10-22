import React, { useEffect, useMemo, useState } from "react";
import FinancialWellnessCard from "./FinancialWellnessCard";
import GoalPlanner from "./GoalPlanner";
import BalanceSummary from "./BalanceSummary";
import SubscriptionHunter, { deriveSubscriptionSummary } from "./SubscriptionHunter";
import CashflowMini from "./CashflowMini";
import SpendingByCategory from "./SpendingByCategory";
import SpendingChart from "./SpendingChart";
import UpcomingBills from "./UpcomingBills";
import FinancialAlerts from "./FinancialAlerts";
import TransactionsList from "./TransactionsList";
import TransactionAnalysis from "./TransactionAnalysis";
import SpendingForecast from "./SpendingForecast";
import PlanGate from "./PlanGate";
import DashboardTour, { TourStep } from "./DashboardTour";
import TutorialButton from "./TutorialButton";
import { useBasiqData } from "../hooks/useBasiqData";
import { useAuth } from "../contexts/AuthContext";
import { useGeminiAI } from "../hooks/useGeminiAI";
import { formatCurrency } from "../utils/currency";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const region = user?.region ?? "AU";
  const { accounts, transactions, loading, error, lastUpdated } = useBasiqData(user?.email);
  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
  const aiData = useGeminiAI(transactions, totalBalance, region);

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const seenTour = localStorage.getItem("financly_tour_seen");
    if (!seenTour && accounts.length > 0) {
      setTourOpen(true);
      localStorage.setItem("financly_tour_seen", "1");
    }
  }, [accounts.length, user]);

  const subscriptionSummary = useMemo(() => deriveSubscriptionSummary(transactions), [transactions]);
  const subscriptionTotal = subscriptionSummary.reduce((sum, item) => sum + item.total, 0);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    const recent = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return !Number.isNaN(date.getTime()) && date >= start;
    });
    const income = recent.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = Math.abs(recent.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
    return {
      income,
      expenses,
      net: income - expenses,
    };
  }, [transactions]);

  const tourSteps: TourStep[] = [
    {
      id: "financial-wellness",
      title: "Wellness score",
      description: "See your debt-to-income ratio, savings split, and monthly snapshot updated in real time.",
    },
    {
      id: "goal-planner",
      title: "Goal planner",
      description: "Create goals after funding them at your bank, then we track progress and celebrate contributions.",
    },
    {
      id: "balance-summary",
      title: "Balance summary",
      description: "Spending availability vs. net worth and mortgages all in one glance.",
    },
    {
      id: "subscription-hunter",
      title: "Subscription Hunter",
      description: "AI groups repeat merchants and shows how often they bill you.",
      mobileHint: "Swipe right to reveal more tools on mobile.",
    },
    {
      id: "cashflow",
      title: "Cashflow & categories",
      description: "Monitor break-even trends and where your dollars go each month.",
    },
    {
      id: "alerts",
      title: "AI alerts",
      description: "Gemini flags anomalies, opportunities, and reminders. Always includes a disclaimer.",
    },
    {
      id: "transactions",
      title: "Transaction analyst",
      description: "Filter, search, and let AI summarise your history with upgrade-only extras.",
    },
  ];

  if (loading && accounts.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-500">
        <p>Loading your financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-red-500">
        <p>Failed to load data: {error}</p>
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-slate-500">
        <p>No data yet. Connect your bank to see your dashboard.</p>
      </div>
    );
  }

  const subscriptionTeaser = subscriptionSummary.length
    ? `We found ${subscriptionSummary.length} services costing ${formatCurrency(subscriptionTotal, region)} per month.`
    : "Connect a bank to discover recurring services.";
  const cashflowTeaser = monthlyStats.income
    ? `Income ${formatCurrency(monthlyStats.income, region)} vs spend ${formatCurrency(monthlyStats.expenses, region)}.`
    : "Link your accounts to calculate monthly cashflow.";
  const alertsTeaser = aiData.alerts.length
    ? `${aiData.alerts.length} alerts queued. Upgrade to read them.`
    : "AI alerts ready once your bank sync completes.";
  const analysisTeaser = aiData.insights?.insights.length
    ? `${aiData.insights.insights.length} AI notes waiting inside transaction analysis.`
    : "Upgrade to unlock AI commentary on every transaction.";

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10 lg:gap-14">
      <FinancialWellnessCard accounts={accounts} transactions={transactions} region={region} />
      <GoalPlanner accounts={accounts} transactions={transactions} />

      <div className="tool-carousel" data-tour-id="hero-cards">
        <BalanceSummary accounts={accounts} />
        <PlanGate feature="Subscription Hunter" teaser={subscriptionTeaser}>
          <SubscriptionHunter transactions={transactions} region={region} />
        </PlanGate>
      </div>

      <div className="tool-carousel" data-tour-id="cashflow">
        <PlanGate feature="Cashflow monthly" teaser={cashflowTeaser}>
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10" data-tour-id="cashflow">
            <CashflowMini transactions={transactions} />
          </div>
        </PlanGate>
        <PlanGate feature="Spending by category" teaser="Unlock AI to reveal your highest spending categories." dataTourId="spending-category">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <SpendingByCategory transactions={transactions} />
          </div>
        </PlanGate>
      </div>

      <div className="tool-carousel">
        <PlanGate feature="Spending forecast" teaser="Upgrade to view AI cashflow scenarios.">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <SpendingForecast
              transactions={transactions}
              totalBalance={totalBalance}
              savingsPlan={null}
            />
          </div>
        </PlanGate>
        <PlanGate feature="Category trends" teaser="Unlock visual trends with AI commentary.">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <SpendingChart transactions={transactions} />
          </div>
        </PlanGate>
      </div>

      <div className="tool-carousel" data-tour-id="alerts">
        <PlanGate feature="AI alerts" teaser={alertsTeaser}>
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <FinancialAlerts transactions={transactions} />
          </div>
        </PlanGate>
        <PlanGate feature="Upcoming bills" teaser="Upgrade to predict upcoming bills and due dates.">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <UpcomingBills accounts={accounts} />
          </div>
        </PlanGate>
      </div>

      <div className="tool-carousel" data-tour-id="transactions">
        <PlanGate feature="Transactions" teaser="Unlock full transaction history with AI filters.">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <TransactionsList transactions={transactions} />
          </div>
        </PlanGate>
        <PlanGate feature="Transaction analysis" teaser={analysisTeaser}>
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10">
            <TransactionAnalysis transactions={transactions} />
          </div>
        </PlanGate>
      </div>

      {lastUpdated && (
        <p className="text-center text-xs text-slate-400">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
      )}

      <TutorialButton
        onClick={() => {
          setTourStep(0);
          setTourOpen(true);
        }}
      />

      <DashboardTour
        steps={tourSteps}
        isOpen={tourOpen}
        stepIndex={tourStep}
        onNext={() => setTourStep((s) => Math.min(s + 1, tourSteps.length - 1))}
        onBack={() => setTourStep((s) => Math.max(s - 1, 0))}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
