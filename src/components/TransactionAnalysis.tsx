import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction } from '../types';
// FIX: Corrected import casing to match file system.
import { getTransactionInsights, TransactionAnalysisResult } from '../services/GeminiService';
import TransactionsList from './TransactionsList';
import { LightbulbIcon, ScissorsIcon, TrashIcon } from './icon/Icon';
// FIX: Corrected import casing to match file system.
import { useAuth } from '../contexts/authContext';
import ProFeatureBlocker from './ProFeatureBlocker';
import { useOnScreen } from '../hooks/useOnScreen';
import { formatCurrency } from '../utils/currency';

interface TransactionAnalysisProps {
  transactions: Transaction[];
}

const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
);


const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({ transactions }) => {
    const { user } = useAuth();
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useOnScreen(ref);
    const [analysis, setAnalysis] = useState<TransactionAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for filters and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const transactionsPerPage = 10;

    // Get unique categories for the filter dropdown
    const uniqueCategories = useMemo(() => {
        const categories = new Set(transactions.map(t => t.category));
        return ['All', ...Array.from(categories).sort()];
    }, [transactions]);

    // Apply filters and search
    const filteredTransactions = useMemo(() => {
        setCurrentPage(1); // Reset to first page on any filter change
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            // Adjust date objects to correctly compare dates without time interference
            if (start) start.setUTCHours(0, 0, 0, 0);
            if (end) end.setUTCHours(23, 59, 59, 999);

            return (
                transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (selectedCategory === 'All' || transaction.category === selectedCategory) &&
                (!start || transactionDate >= start) &&
                (!end || transactionDate <= end)
            );
        });
    }, [transactions, searchTerm, selectedCategory, startDate, endDate]);

    // Pagination logic
    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

    const handleClearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setSelectedCategory('All');
        setCurrentPage(1);
    };

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


    return (
        <div className="bg-content-bg p-6 rounded-xl border border-border-color" ref={ref}>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Transaction History</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    {/* Filter controls */}
                    <div className="space-y-4 mb-6 p-4 bg-background rounded-lg border border-border-color">
                        <input
                            type="text"
                            placeholder="Search by description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 bg-content-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            aria-label="Search transactions"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-text-secondary">Category</label>
                                <select
                                    id="category"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 bg-content-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                >
                                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-text-secondary">Start Date</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-content-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-text-secondary">End Date</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-content-bg border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>
                         <button onClick={handleClearFilters} className="text-sm font-semibold text-primary hover:underline mt-2">
                            Clear Filters
                        </button>
                    </div>
                    
                    <TransactionsList transactions={currentTransactions} />

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-text-secondary bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-text-secondary">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-text-secondary bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 space-y-8">
                    {/* AI Insights Card */}
                    <div>
                        <div className="flex items-center mb-4">
                            <LightbulbIcon className="h-6 w-6 text-warning" />
                            <h3 className="text-xl font-bold text-text-primary ml-3">Spending Insights</h3>
                        </div>
                        {user?.membershipType === 'Pro' ? (
                            <>
                                {isLoading && <LoadingSkeleton />}
                                {error && <p className="text-red-500">{error}</p>}
                                {analysis && (
                                    <ul className="space-y-3">
                                        {analysis.insights.map((insight, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="text-xl mr-3">{insight.emoji}</span>
                                                <span className="text-text-secondary">{insight.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        ) : (
                            <ProFeatureBlocker featureTitle="AI Spending Insights" teaserText="Get AI-powered insights to improve your spending habits.">
                                <LoadingSkeleton />
                            </ProFeatureBlocker>
                        )}
                    </div>

                    {/* Subscription Hunter Card */}
                    <div>
                        <div className="flex items-center mb-4">
                            <ScissorsIcon className="h-6 w-6 text-red-500" />
                            <h3 className="text-xl font-bold text-text-primary ml-3">Subscription Hunter</h3>
                        </div>
                        {user?.membershipType === 'Pro' ? (
                             <>
                                {isLoading && <LoadingSkeleton />}
                                {analysis && analysis.subscriptions.length > 0 && (
                                    <ul className="space-y-3">
                                        {analysis.subscriptions.map((sub, index) => (
                                            <li key={index} className="flex items-center justify-between p-3 bg-background rounded-md border border-border-color">
                                                <div>
                                                    <span className="text-text-secondary font-medium">{sub.name}</span>
                                                    <span className="text-text-primary font-bold ml-4">{formatCurrency(Math.abs(sub.amount), user?.region)}</span>
                                                </div>
                                                <a
                                                    href={sub.cancellationUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
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
                                    <p className="text-text-secondary">No recurring subscriptions found in your recent transactions.</p>
                                )}
                            </>
                        ) : (
                             <ProFeatureBlocker featureTitle="Subscription Hunter" teaserText={!analysis && isLoading ? "Finding your recurring subscriptions..." : `AI found ${analysis?.subscriptions?.length || 0} recurring subscription${analysis?.subscriptions?.length !== 1 ? 's' : ''}.`}>
                                <div className="space-y-3"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div></div>
                             </ProFeatureBlocker>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionAnalysis;