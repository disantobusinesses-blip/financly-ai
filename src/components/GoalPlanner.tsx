import { useEffect, useMemo, useRef, useState } from "react";
import { Account, Transaction } from "../types";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { CalendarIcon, PiggyBankIcon, SparklesIcon, TargetIcon, TrashIcon } from "./icon/Icon";

interface GoalPlannerProps {
  accounts: Account[];
  transactions: Transaction[];
  aiSuggestions?: { emoji: string; text: string }[];
}

interface StoredGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  createdAt: string;
  aiAdvice?: { emoji: string; text: string } | null;
  celebratedMilestones?: number[];
}

type SortMode = "progress" | "timeline";

const STORAGE_KEY = "financly-ai-goals-v2";
const milestoneThresholds = [0.25, 0.5, 0.75, 1];
const fallbackEmojis = ["🚗", "🏡", "🌴", "🎓", "🎉", "🧘", "💡", "📚", "🛠", "🛫"];

const createCelebrationId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createId = () => Math.random().toString(36).slice(2, 10);

const clampNumber = (value: number) => (Number.isFinite(value) && value >= 0 ? value : 0);

const parseNumber = (value: string) => {
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatRelativeTime = (date: Date) => {
  const now = Date.now();
  const diff = date.getTime() - now;
  if (diff <= 0) return "now";
  const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"}`;
  }
  const diffYears = diffMonths / 12;
  return `${diffYears.toFixed(diffYears < 2 ? 1 : 0)} year${diffYears < 2 ? "" : "s"}`;
};

interface CelebrationState {
  id: string;
  goalName: string;
  milestone: number;
  kind: "contribution" | "milestone";
  amount?: number;
}

interface UpdateGoalOptions {
  celebrateAlways?: boolean;
  contributionAmount?: number;
}

const GoalPlanner: React.FC<GoalPlannerProps> = ({ accounts, transactions, aiSuggestions = [] }) => {
  const { user } = useAuth();
  const region = user?.region ?? "AU";
  const celebrantName = useMemo(() => {
    if (!user?.email) return "there";
    const [localPart] = user.email.split("@");
    if (!localPart) return "there";
    const formatted = localPart.replace(/[^a-zA-Z0-9]/g, " ").trim();
    if (!formatted) return "there";
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [user?.email]);
  const [goals, setGoals] = useState<StoredGoal[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("progress");
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [contributionDrafts, setContributionDrafts] = useState<Record<string, string>>({});
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [draftEmojiIndex, setDraftEmojiIndex] = useState(0);
  const aiPointer = useRef(0);

  const monthlySavings = useMemo(() => {
    if (!transactions.length) return 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime());
    thirtyDaysAgo.setDate(now.getDate() - 30);

    let income = 0;
    let expenses = 0;
    for (const txn of transactions) {
      const parsed = new Date(txn.date);
      if (Number.isNaN(parsed.getTime()) || parsed < thirtyDaysAgo || parsed > now) continue;
      const amount = Number(txn.amount) || 0;
      if (amount > 0) {
        income += amount;
      } else {
        expenses += Math.abs(amount);
      }
    }

    const net = income - expenses;
    return net > 0 ? net : 0;
  }, [transactions]);

  const totalSavingsBalance = useMemo(
    () =>
      accounts.reduce((sum, account) => {
        return account.balance > 0 ? sum + account.balance : sum;
      }, 0),
    [accounts]
  );

  const loadStoredGoals = () => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as StoredGoal[];
      return parsed.map((goal, index) => ({
        id: goal.id ?? createId(),
        name: goal.name ?? "Untitled Goal",
        emoji: goal.emoji ?? fallbackEmojis[index % fallbackEmojis.length],
        targetAmount: clampNumber(goal.targetAmount ?? 0),
        currentAmount: clampNumber(goal.currentAmount ?? 0),
        targetDate: goal.targetDate ?? null,
        createdAt: goal.createdAt ?? new Date().toISOString(),
        aiAdvice: goal.aiAdvice ?? null,
        celebratedMilestones: Array.isArray(goal.celebratedMilestones)
          ? goal.celebratedMilestones
          : [],
      }));
    } catch (error) {
      console.error("Failed to parse stored goals", error);
      return [];
    }
  };

  useEffect(() => {
    const stored = loadStoredGoals();
    setGoals(stored);
    if (stored.length) {
      setDraftEmojiIndex(stored.length % fallbackEmojis.length);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (!celebration) return;
    const timeout = window.setTimeout(() => setCelebration(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [celebration]);

  const sortedGoals = useMemo(() => {
    const enriched = goals.map((goal) => {
      const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
      let estimatedDate: Date | null = null;
      if (goal.targetDate) {
        const parsed = new Date(goal.targetDate);
        if (!Number.isNaN(parsed.getTime())) {
          estimatedDate = parsed;
        }
      } else if (progress < 1 && monthlySavings > 0) {
        const remaining = goal.targetAmount - goal.currentAmount;
        const months = remaining / monthlySavings;
        const estimate = new Date();
        estimate.setDate(estimate.getDate() + Math.round(months * 30));
        estimatedDate = estimate;
      }
      return { ...goal, progress, estimatedDate };
    });

    if (sortMode === "timeline") {
      return [...enriched].sort((a, b) => {
        if (a.estimatedDate && b.estimatedDate) {
          return a.estimatedDate.getTime() - b.estimatedDate.getTime();
        }
        if (a.estimatedDate) return -1;
        if (b.estimatedDate) return 1;
        return b.progress - a.progress;
      });
    }

    return [...enriched].sort((a, b) => b.progress - a.progress);
  }, [goals, monthlySavings, sortMode]);

  const getNextSuggestion = () => {
    if (!aiSuggestions.length) return null;
    const suggestion = aiSuggestions[aiPointer.current % aiSuggestions.length];
    aiPointer.current += 1;
    return suggestion;
  };

  const handleAddGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = (form.get("goalName") as string)?.trim();
    const targetAmount = clampNumber(parseNumber((form.get("goalTarget") as string) || "0"));
    const currentAmount = clampNumber(parseNumber((form.get("goalCurrent") as string) || "0"));
    const targetDate = (form.get("goalDate") as string) || "";
    const emojiIndex = Number.parseInt((form.get("goalEmoji") as string) || "0", 10);

    if (!name || targetAmount <= 0) {
      return;
    }

    const selectedIndex = Number.isNaN(emojiIndex) ? draftEmojiIndex : emojiIndex;
    const emoji = fallbackEmojis[selectedIndex % fallbackEmojis.length];
    const nextEmojiIndex = (selectedIndex + 1) % fallbackEmojis.length;
    const suggestion = getNextSuggestion();

    setGoals((prev) => [
      ...prev,
      {
        id: createId(),
        name,
        emoji,
        targetAmount,
        currentAmount: Math.min(currentAmount, targetAmount),
        targetDate: targetDate ? targetDate : null,
        createdAt: new Date().toISOString(),
        aiAdvice: suggestion,
        celebratedMilestones: [],
      },
    ]);

    setDraftEmojiIndex(nextEmojiIndex);
    event.currentTarget.reset();
  };

  const triggerCelebration = (details: CelebrationState) => {
    setCelebration(details);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
    setContributionDrafts((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const updateGoal = (
    id: string,
    updates: Partial<StoredGoal>,
    options: UpdateGoalOptions = {}
  ) => {
    let upcomingCelebration: CelebrationState | null = null;
    let latestProgress = 0;
    let latestGoalName: string | null = null;

    setGoals((prev) => {
      const next = prev.map((goal) => {
        if (goal.id !== id) return goal;
        const previousProgress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
        const updated: StoredGoal = {
          ...goal,
          ...updates,
        };
        updated.currentAmount = Math.min(updated.currentAmount, updated.targetAmount);
        latestGoalName = updated.name;
        latestProgress =
          updated.targetAmount > 0 ? updated.currentAmount / updated.targetAmount : previousProgress;
        const celebrated = new Set(updated.celebratedMilestones ?? []);
        for (const threshold of milestoneThresholds) {
          if (previousProgress < threshold && latestProgress >= threshold && !celebrated.has(threshold)) {
            celebrated.add(threshold);
            upcomingCelebration = {
              id: createCelebrationId(),
              goalName: updated.name,
              milestone: threshold,
              kind: "milestone",
            };
            break;
          }
        }
        updated.celebratedMilestones = Array.from(celebrated);
        return updated;
      });

      if (!upcomingCelebration && options.celebrateAlways && latestGoalName) {
        upcomingCelebration = {
          id: createCelebrationId(),
          goalName: latestGoalName,
          milestone: latestProgress,
          kind: "contribution",
          amount: options.contributionAmount,
        };
      }

      return next;
    });

    if (upcomingCelebration) {
      triggerCelebration(upcomingCelebration);
    }
  };

  const handleContribution = (event: React.FormEvent<HTMLFormElement>, goal: StoredGoal) => {
    event.preventDefault();
    const amount = clampNumber(parseNumber(contributionDrafts[goal.id] ?? "0"));
    if (amount <= 0) return;
    updateGoal(
      goal.id,
      { currentAmount: goal.currentAmount + amount },
      { celebrateAlways: true, contributionAmount: amount }
    );
    setContributionDrafts((prev) => ({ ...prev, [goal.id]: "" }));
  };

  const annualSavingsCapacity = monthlySavings > 0 ? monthlySavings * 12 : Math.max(totalSavingsBalance * 0.1, 0);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" aria-hidden="true" />
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <TargetIcon className="h-4 w-4" /> Goals
            </span>
            <h2 className="text-2xl font-semibold sm:text-3xl">Savings milestones</h2>
            <p className="max-w-2xl text-sm text-white/70 sm:text-base">
              Build goals the AI can celebrate with you. Track progress, pick a target date, or let Financly estimate a finish line based on your current savings rhythm.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <label className="text-xs uppercase tracking-wide text-white/60" htmlFor="goal-sort">
              Sort by
            </label>
            <select
              id="goal-sort"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm focus:border-white focus:outline-none"
            >
              <option value="progress">Highest progress</option>
              <option value="timeline">Earliest timeline</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleAddGoal} className="mt-8 grid gap-4 rounded-2xl bg-white/10 p-5 shadow-inner backdrop-blur-sm lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60" htmlFor="goalName">
              Goal name
            </label>
            <input
              id="goalName"
              name="goalName"
              required
              placeholder="e.g. Europe trip"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60" htmlFor="goalTarget">
              Target amount
            </label>
            <input
              id="goalTarget"
              name="goalTarget"
              required
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="$5,000"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60" htmlFor="goalCurrent">
              Saved so far
            </label>
            <input
              id="goalCurrent"
              name="goalCurrent"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="$0"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end lg:flex-col lg:items-start">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/60" htmlFor="goalDate">
                Target date (optional)
              </label>
              <input
                id="goalDate"
                name="goalDate"
                type="date"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div className="sm:w-32 lg:w-full">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/60" htmlFor="goalEmoji">
                Icon
              </label>
              <select
                id="goalEmoji"
                name="goalEmoji"
                value={draftEmojiIndex}
                onChange={(event) => setDraftEmojiIndex(Number.parseInt(event.target.value, 10))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
              >
                {fallbackEmojis.map((emoji, index) => (
                  <option key={emoji} value={index}>
                    {emoji}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-white"
            >
              Add goal
            </button>
          </div>
        </form>

        {sortedGoals.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-white/70">
            <PiggyBankIcon className="h-12 w-12 text-white/50" />
            <p className="text-base font-semibold">No goals yet</p>
            <p className="max-w-xl text-sm">
              Create your first goal to see live progress bars, AI tips, and celebratory shout-outs when you hit each milestone.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {sortedGoals.map((goal) => {
              const progressPercent = Math.min(100, Math.round(goal.progress * 100));
              const isComplete = progressPercent >= 100;
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              let timelineLabel = "Set a target date to lock your plan.";
              if (goal.estimatedDate) {
                const friendly = formatRelativeTime(goal.estimatedDate);
                timelineLabel = goal.targetDate
                  ? `Targeting ${goal.estimatedDate.toLocaleDateString()} (${friendly})`
                  : `Estimated finish in ${friendly} (${goal.estimatedDate.toLocaleDateString()})`;
              } else if (goal.targetDate) {
                const date = new Date(goal.targetDate);
                if (!Number.isNaN(date.getTime())) {
                  timelineLabel = `Targeting ${date.toLocaleDateString()} (${formatRelativeTime(date)})`;
                }
              } else if (monthlySavings <= 0) {
                timelineLabel = "We need a positive savings rate to forecast your finish line.";
              }

              const aiAdvice = goal.aiAdvice?.text;
              const aiEmoji = goal.aiAdvice?.emoji ?? "✨";

              return (
                <div key={goal.id} className="relative overflow-hidden rounded-3xl bg-white/5 p-6 backdrop-blur-sm">
                  <div
                    className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" aria-hidden="true">
                          {goal.emoji}
                        </span>
                        <div>
                          <p className="text-lg font-semibold text-white">{goal.name}</p>
                          <p className="text-sm text-white/70">
                            {formatCurrency(goal.currentAmount, region)} of {formatCurrency(goal.targetAmount, region)} saved
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/60">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{timelineLabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingGoalId(editingGoalId === goal.id ? null : goal.id)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white"
                      >
                        {editingGoalId === goal.id ? "Close" : "Edit"}
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white/40"
                        aria-label={`Delete ${goal.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative mt-6 space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${isComplete ? "bg-emerald-300" : "bg-primary/70"}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {!isComplete && (
                      <p className="text-xs text-white/60">
                        {formatCurrency(remaining, region)} remaining
                      </p>
                    )}
                    {isComplete && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                        Goal achieved!
                      </p>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-white/80 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-white/60">Contribution pace</p>
                      <p className="mt-2 font-semibold text-white">
                        {monthlySavings > 0
                          ? `${formatCurrency(monthlySavings, region)}/month`
                          : `${formatCurrency(totalSavingsBalance * 0.05, region)} potential`}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Based on the last 30 days of inflows.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-white/60">AI insight</p>
                      <p className="mt-2 flex items-start gap-2 text-sm">
                        <span aria-hidden="true">{aiEmoji}</span>
                        <span>{aiAdvice ?? "Stay consistent with transfers to keep momentum."}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-white/60">Next milestone</p>
                      <p className="mt-2 font-semibold text-white">
                        {isComplete
                          ? "Completed"
                          : `${milestoneThresholds.find((threshold) => progressPercent < threshold * 100)! * 100}%`}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Confetti unlocks at 25%, 50%, 75%, and 100%.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(event) => handleContribution(event, goal)}
                    className="mt-6 flex flex-col gap-3 rounded-2xl bg-white/5 p-4 sm:flex-row sm:items-center"
                  >
                    <label className="text-xs font-semibold uppercase tracking-wide text-white/60 sm:w-40">
                      Log a contribution
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={contributionDrafts[goal.id] ?? ""}
                      onChange={(event) =>
                        setContributionDrafts((prev) => ({ ...prev, [goal.id]: event.target.value }))
                      }
                      placeholder="$200"
                      className="w-full flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-white"
                    >
                      Update goal
                    </button>
                  </form>

                  {editingGoalId === goal.id && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        const name = (form.get("editName") as string)?.trim() || goal.name;
                        const targetAmount = clampNumber(
                          parseNumber((form.get("editTarget") as string) || `${goal.targetAmount}`)
                        );
                        const currentAmount = clampNumber(
                          parseNumber((form.get("editCurrent") as string) || `${goal.currentAmount}`)
                        );
                        const targetDate = (form.get("editDate") as string) || "";
                        const emoji = (form.get("editEmoji") as string) || goal.emoji;

                        updateGoal(goal.id, {
                          name,
                          targetAmount: targetAmount || goal.targetAmount,
                          currentAmount: Math.min(currentAmount, targetAmount || goal.targetAmount),
                          targetDate: targetDate ? targetDate : null,
                          emoji,
                        });
                        setEditingGoalId(null);
                      }}
                      className="mt-6 space-y-4 rounded-2xl bg-white/5 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                        Edit goal
                      </p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="text-sm text-white/80">
                          Name
                          <input
                            name="editName"
                            defaultValue={goal.name}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                        </label>
                        <label className="text-sm text-white/80">
                          Icon
                          <input
                            name="editEmoji"
                            defaultValue={goal.emoji}
                            maxLength={2}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                        </label>
                        <label className="text-sm text-white/80">
                          Target amount
                          <input
                            name="editTarget"
                            defaultValue={goal.targetAmount}
                            inputMode="decimal"
                            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                        </label>
                        <label className="text-sm text-white/80">
                          Saved so far
                          <input
                            name="editCurrent"
                            defaultValue={goal.currentAmount}
                            inputMode="decimal"
                            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                        </label>
                        <label className="text-sm text-white/80">
                          Target date
                          <input
                            type="date"
                            name="editDate"
                            defaultValue={goal.targetDate ?? ""}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingGoalId(null)}
                          className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:border-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 grid gap-4 rounded-2xl bg-white/5 p-6 text-sm text-white/80 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <SparklesIcon className="mt-1 h-5 w-5 text-white/70" />
            <p>
              {monthlySavings > 0
                ? `At your current savings rate, you could add another ${formatCurrency(annualSavingsCapacity, region)} goal this year.`
                : "Once income outpaces spending we'll suggest how much capacity you can allocate to a fresh goal."}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <PiggyBankIcon className="mt-1 h-5 w-5 text-white/70" />
            <p>
              Keep goals sorted by progress or timeline to spotlight where an extra transfer unlocks the next celebration.
            </p>
          </div>
        </div>
      </div>

      {celebration && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-40 flex justify-center px-4 sm:justify-end sm:px-6">
          <div className="pointer-events-auto w-full max-w-sm rounded-3xl bg-white/95 px-6 py-5 text-slate-900 shadow-2xl ring-1 ring-slate-900/10">
            <p className="text-lg font-semibold">Great stuff {celebrantName}!</p>
            <p className="mt-2 text-sm text-slate-600">
              {celebration.kind === "milestone"
                ? celebration.milestone >= 1
                  ? `${celebration.goalName} is officially complete. Incredible effort!`
                  : `${celebration.goalName} just passed the ${Math.round(celebration.milestone * 100)}% mark — keep the streak alive!`
                : celebration.amount
                ? `That ${formatCurrency(celebration.amount, region)} boost keeps ${celebration.goalName} on track.`
                : `${celebration.goalName} is tracking brilliantly — keep the deposits coming!`}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default GoalPlanner;
