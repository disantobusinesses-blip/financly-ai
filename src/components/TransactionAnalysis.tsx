import { useEffect, useMemo, useRef, useState } from "react";
import { Transaction } from "../types";
import {
  getTransactionInsights,
  TransactionAnalysisResult,
} from "../services/GeminiService";
import TransactionsList from "./TransactionsList";
import { LightbulbIcon, ScissorsIcon, TrashIcon } from "./icon/Icon";
import { useAuth } from "../contexts/AuthContext";
import { useOnScreen } from "../hooks/useOnScreen";
import { formatCurrency } from "../utils/currency";
import Card from "./Card";

interface TransactionAnalysisProps {
  transactions: Transaction[];
}

const LoadingSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-4 rounded-xl bg-slate-200" />
    <div className="h-4 rounded-xl bg-slate-200" />
    <div className="h-4 rounded-xl bg-slate-200" />
  </div>
);

const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({ transactions }) => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLElement>(null);
  const isVisible = useOnScreen(cardRef);
  const [analysis, setAnalysis] = useState<TransactionAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map((t) => t.category).filter(Boolean));
    return ["All", ...Array.from(categories).sort()];
  }, [transactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) start.setUTCHours(0, 0, 0, 0);
      if (end) end.setUTCHours(23, 59, 59, 999);

      return (
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || transaction.category === selectedCategory) &&
        (!start || transactionDate >= start) &&
        (!end || transactionDate <= end)
      );
    });
  }, [transactions, searchTerm, selectedCategory, startDate, endDate]);

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage) || 1;

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (isVisible && transactions.length > 0 && !hasFetched && user) {
        setIsLoading(true);
        setHasFetched(true);
        setError(null);
        try {
          const result = await getTransactionInsights(transactions, user.region);
          setAnalysis(result);
        } catch (err) {
          console.error(err);
          setError("Could not load AI analysis. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAnalysis();
  }, [isVisible, transactions, hasFetched, user]);

  const filteredSpend = useMemo(
    () =>
      filteredTransactions.reduce((sum, txn) => {
        if (txn.amount < 0) {
          return sum + Math.abs(txn.amount);
        }
        return sum;
      }, 0),
    [filteredTransactions]
  );

  const insightsSummary: {
    label: string;
    value: string;
    tone?: "positive" | "negative" | "neutral";
  }[] = [
    { label: "Filtered", value: String(filteredTransactions.length) },
    {
      label: "Tracked spend",
      value: formatCurrency(filteredSpend, user?.region),
      tone: filteredSpend > 0 ? "negative" : "neutral",
    },
    {
      label: "AI tips",
      value: analysis ? `${analysis.insights.length}` : isLoading ? "…" : "0",
    },
  ];

  return (
    <Card
      ref={cardRef}
      title="Transaction history analyst"
      subtitle="Filter, search and let AI uncover the biggest savings in your ledger."
      icon={<LightbulbIcon className="h-7 w-7" />}
      insights={insightsSummary}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="text"
              placeholder="Search by description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Search transactions"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="category"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Start date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  End date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setStartDate("");
                setEndDate("");
                setSelectedCategory("All");
              }}
              className="text-sm font-semibold text-primary transition hover:underline"
            >
              Clear filters
            </button>
          </div>

          <TransactionsList transactions={currentTransactions} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <LightbulbIcon className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-900">Spending insights</h3>
            </div>
            {isLoading && <LoadingSkeleton />}
            {error && <p className="text-sm text-rose-500">{error}</p>}
            {analysis && !isLoading && !error && (
              <ul className="space-y-3 text-sm text-slate-600">
                {analysis.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xl">{insight.emoji}</span>
                    <span>{insight.text}</span>
                  </li>
                ))}
              </ul>
            )}
            {!analysis && !isLoading && !error && (
              <p className="text-sm text-slate-500">
                Connect more transactions to unlock personalised insights on your spending.
              </p>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <ScissorsIcon className="h-6 w-6 text-rose-500" />
              <h3 className="text-lg font-semibold text-slate-900">Subscription hunter</h3>
            </div>
            {isLoading && <LoadingSkeleton />}
            {analysis && analysis.subscriptions.length > 0 && (
              <ul className="space-y-3 text-sm text-slate-600">
                {analysis.subscriptions.map((sub, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-900">{sub.name}</span>
                      <span className="text-sm text-slate-500">
                        {formatCurrency(Math.abs(sub.amount), user?.region)}
                      </span>
                    </div>
                    <a
                      href={sub.cancellationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-500 transition hover:bg-rose-50"
                      aria-label={`Find out how to cancel ${sub.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Cancel</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {analysis && analysis.subscriptions.length === 0 && !isLoading && (
              <p className="text-sm text-slate-500">
                No recurring subscriptions found in your recent transactions.
              </p>
            )}
            {!analysis && !isLoading && (
              <p className="text-sm text-slate-500">
                Connect more accounts or refresh to surface recurring subscriptions.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TransactionAnalysis;
