import { useEffect, useMemo, useRef, useState } from "react";
import { Transaction } from "../types";
import {
  getTransactionInsights,
  TransactionAnalysisResult,
} from "../services/GeminiService";
import TransactionsList from "./TransactionsList";
import { LightbulbIcon } from "./icon/Icon";
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

  const filteredNet = useMemo(
    () =>
      filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0),
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
      label: "Net change",
      value: formatCurrency(filteredNet, user?.region),
      tone: filteredNet >= 0 ? "positive" : "negative",
    },
    {
      label: "AI overview",
      value: isLoading ? "Loading" : analysis ? "Ready" : "Pending",
      tone: error ? "negative" : analysis ? "positive" : "neutral",
    },
  ];

  return (
    <Card
      ref={cardRef}
      title="Transaction history analyst"
      subtitle="Filter, search, and pair the results with neutral AI stats drawn from your connected accounts."
      icon={<LightbulbIcon className="h-7 w-7" />}
      insights={insightsSummary}
    >
      <div className="space-y-6">
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

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">AI cashflow summary</h3>
              <p className="text-xs uppercase tracking-wide text-slate-400">Neutral observations only</p>
            </div>
          </div>
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : analysis ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">{analysis.summary}</p>
              {analysis.stats.length > 0 && (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {analysis.stats.map((stat, index) => (
                    <li
                      key={`${stat.label}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          stat.tone === "positive"
                            ? "text-emerald-600"
                            : stat.tone === "negative"
                            ? "text-rose-600"
                            : "text-slate-700"
                        }`}
                      >
                        {stat.value}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-400">{analysis.disclaimer}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Connect more accounts or scroll back once data loads to generate an AI summary.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TransactionAnalysis;
