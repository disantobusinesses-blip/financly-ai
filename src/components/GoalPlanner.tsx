import React, { useEffect, useMemo, useState } from "react";
import { Account, Transaction } from "../types";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";

interface PlannerGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  createdAt: string;
  milestoneHistory: number[];
}

interface GoalPlannerProps {
  accounts: Account[];
  transactions: Transaction[];
}

const goalEmojis = ["🚗", "✈️", "🏡", "🎓", "💍", "🛠️", "🧸", "🎉", "🌍", "💻"];

const GoalPlanner: React.FC<GoalPlannerProps> = ({ accounts, transactions }) => {
  const { user } = useAuth();
  const storageKey = user ? `goal-planner-${user.id}` : "goal-planner";

  const [goals, setGoals] = useState<PlannerGoal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [sortMode, setSortMode] = useState<"progress" | "time">("progress");
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setGoals(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to parse stored goals", error);
    }
  }, [storageKey, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey, JSON.stringify(goals));
  }, [goals, storageKey, user]);

  const monthlySavingsRate = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    const recentTx = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return !Number.isNaN(date.getTime()) && date >= start;
    });
    const income = recentTx.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = Math.abs(recentTx.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
    return Math.max(0, income - expenses);
  }, [transactions]);

  const addToast = (message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const handleAddGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const target = Number(formData.get("target") || 0);
    const targetDate = String(formData.get("targetDate") || "").trim();
    const emoji = String(formData.get("emoji") || goalEmojis[0]);

    if (!name || target <= 0) return;

    const newGoal: PlannerGoal = {
      id: `goal-${Date.now()}`,
      name,
      emoji,
      targetAmount: target,
      currentAmount: 0,
      targetDate: targetDate || undefined,
      createdAt: new Date().toISOString(),
      milestoneHistory: [],
    };

    setGoals((prev) => [...prev, newGoal]);
    setIsAdding(false);
    form.reset();
    addToast(`Goal “${name}” created. Track it through your bank account deposits.`);
  };

  const handleContribution = (goalId: string, amount: number) => {
    if (!amount || Number.isNaN(amount)) return;
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const updated = { ...goal };
        updated.currentAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
        const progress = (updated.currentAmount / goal.targetAmount) * 100;
        const milestones = [25, 50, 75, 100];
        milestones.forEach((milestone) => {
          if (progress >= milestone && !updated.milestoneHistory.includes(milestone)) {
            updated.milestoneHistory = [...updated.milestoneHistory, milestone];
            addToast(`Great stuff ${user?.displayName || "there"}! ${milestone}% of ${goal.name}`);
          }
        });
        if (progress >= 100) {
          addToast(`Goal achieved! ${goal.emoji} ${goal.name}`);
        } else {
          addToast(`Great stuff ${user?.displayName || "there"}! Added ${formatCurrency(amount, user?.region)} to ${goal.name}`);
        }
        return updated;
      })
    );
  };

  const handleDelete = (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  const sortedGoals = useMemo(() => {
    const cloned = [...goals];
    if (sortMode === "progress") {
      cloned.sort((a, b) => b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount);
    } else {
      cloned.sort((a, b) => {
        const aDate = a.targetDate ? new Date(a.targetDate).getTime() : Number.POSITIVE_INFINITY;
        const bDate = b.targetDate ? new Date(b.targetDate).getTime() : Number.POSITIVE_INFINITY;
        return aDate - bDate;
      });
    }
    return cloned;
  }, [goals, sortMode]);

  const insight = useMemo(() => {
    const totalSavings = accounts.filter((acc) => acc.balance > 0).reduce((sum, acc) => sum + acc.balance, 0);
    if (!monthlySavingsRate) {
      return "Connect your bank and add regular contributions to calculate savings insights.";
    }
    const extraGoal = monthlySavingsRate * 6;
    return `At your current savings rate of ${formatCurrency(monthlySavingsRate, user?.region)} per month you could add another ${formatCurrency(extraGoal, user?.region)} goal this year. Your accounts currently hold ${formatCurrency(totalSavings, user?.region)}.`;
  }, [accounts, monthlySavingsRate, user?.region]);

  return (
    <section
      className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-white/10"
      data-tour-id="goal-planner"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Savings milestones</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Goal planner</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Create your goal with your bank first, then let Financly AI track the progress based on live balances.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
            Sort by
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as "progress" | "time")}
              className="rounded-xl border border-slate-200 px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="progress">Progress</option>
              <option value="time">Target date</option>
            </select>
          </label>
          <button
            onClick={() => setIsAdding((v) => !v)}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90"
          >
            {isAdding ? "Cancel" : "Add goal"}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddGoal} className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="font-semibold">Goal name</span>
              <input
                name="name"
                required
                placeholder="New Car"
                className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-semibold">Target amount</span>
              <input
                name="target"
                type="number"
                required
                min="100"
                step="50"
                placeholder="15000"
                className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-semibold">Target date (optional)</span>
              <input
                name="targetDate"
                type="date"
                className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-semibold">Goal emoji</span>
              <select
                name="emoji"
                className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              >
                {goalEmojis.map((emoji) => (
                  <option key={emoji} value={emoji}>
                    {emoji}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
            >
              Save goal
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sortedGoals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-300">
            Add your first goal to start tracking progress. Every contribution gets a shout-out.
          </div>
        ) : (
          sortedGoals.map((goal) => {
            const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const estimatedMonths = monthlySavingsRate > 0 ? Math.ceil(remaining / monthlySavingsRate) : null;
            const estimatedCompletion = goal.targetDate
              ? new Date(goal.targetDate).toLocaleDateString()
              : estimatedMonths
              ? new Date(Date.now() + estimatedMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
              : "Set a savings rhythm to estimate";
            return (
              <div key={goal.id} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl">{goal.emoji}</p>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{goal.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Target: {formatCurrency(goal.targetAmount, user?.region)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-200">
                    <span>{progress.toFixed(0)}% complete</span>
                    <span>{formatCurrency(goal.currentAmount, user?.region)} saved</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                  <span>Estimated completion</span>
                  <span>{estimatedCompletion}</span>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const contribution = Number(data.get("amount"));
                    if (contribution > 0) {
                      handleContribution(goal.id, contribution);
                      event.currentTarget.reset();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Add contribution"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
                  >
                    Add
                  </button>
                </form>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-6 text-sm font-semibold text-primary" data-tour-id="goal-insight">
        {insight} This is not financial advice.
      </p>

      {toasts.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg"
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default GoalPlanner;
