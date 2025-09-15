import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Account, InvestmentAdvice, RiskTolerance } from '../types';
// FIX: Corrected import casing to match file system.
import { useAuth } from '../contexts/AuthContext';
import { useOnScreen } from '../hooks/useOnScreen';
// FIX: Corrected import casing to match file system.
import { getInvestmentAdvice } from '../services/GeminiService';
import ProFeatureBlocker from './ProFeatureBlocker';
import { BriefcaseIcon, SparklesIcon } from './icon/Icon';

interface AIInvestmentAdvisorProps {
    accounts: Account[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#6366F1'];

const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-full w-64 mx-auto"></div>
        <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
    </div>
);

const CustomTooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-content-bg p-2 border border-border-color rounded-md shadow-lg">
                <p className="font-bold text-text-primary">{`${data.name}: ${data.percentage}%`}</p>
            </div>
        );
    }
    return null;
};


const AIInvestmentAdvisor: React.FC<AIInvestmentAdvisorProps> = ({ accounts }) => {
    const { user } = useAuth();
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useOnScreen(ref);

    const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('Moderate');
    const [advice, setAdvice] = useState<InvestmentAdvice | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Guard conditions: Don't fetch if not visible, no accounts, or not a Pro user.
        if (!isVisible || accounts.length === 0 || user?.membershipType !== 'Pro') {
            return;
        }

        const fetchAdvice = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (!user) return;
                const result = await getInvestmentAdvice(accounts, riskTolerance, user.region);
                setAdvice(result);
            } catch (err) {
                console.error(err);
                setError("Could not load AI investment advice. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdvice();
        // This effect re-runs whenever the component becomes visible or the riskTolerance changes,
        // triggering a new fetch automatically.
    }, [isVisible, accounts, user, riskTolerance]);
    
    const renderContent = () => {
        if (isLoading) return <LoadingSkeleton />;
        if (error) return <div className="h-full flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
        if (!advice) return <div className="h-full flex items-center justify-center"><p className="text-text-secondary">Select your risk tolerance to get started.</p></div>;

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="w-full h-72">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={advice.allocation}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={110}
                                innerRadius={70}
                                fill="#8884d8"
                                dataKey="percentage"
                                nameKey="name"
                                stroke="var(--color-content-bg)"
                                strokeWidth={4}
                            >
                                {advice.allocation.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltipContent />} />
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '14px' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-text-primary text-lg flex items-center">
                        <SparklesIcon className="h-5 w-5 text-primary mr-2" />
                        AI Rationale
                    </h4>
                    <p className="text-text-secondary italic bg-background p-4 rounded-lg border border-border-color">
                        {advice.rationale}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-content-bg p-6 rounded-xl border border-border-color" ref={ref}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex items-center mb-4 md:mb-0">
                    <BriefcaseIcon className="h-7 w-7 text-primary" />
                    <h2 className="text-2xl font-bold text-text-primary ml-3">AI Investment Advisor</h2>
                </div>
                <div>
                     <label htmlFor="risk-tolerance" className="sr-only">Risk Tolerance</label>
                     <select 
                        id="risk-tolerance"
                        value={riskTolerance}
                        onChange={(e) => setRiskTolerance(e.target.value as RiskTolerance)}
                        className="bg-background border border-border-color text-text-primary text-sm font-semibold rounded-lg focus:ring-primary focus:border-primary block w-full md:w-auto px-4 py-2"
                        disabled={user?.membershipType !== 'Pro'}
                     >
                        <option value="Conservative">Conservative</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Aggressive">Aggressive</option>
                     </select>
                </div>
            </div>

            {user?.membershipType === 'Pro' ? (
                renderContent()
            ) : (
                <ProFeatureBlocker
                    featureTitle="AI Investment Advisor"
                    teaserText="Get a personalized investment portfolio based on your risk tolerance. Upgrade to Pro."
                >
                   <LoadingSkeleton />
                </ProFeatureBlocker>
            )}
        </div>
    );
};

export default AIInvestmentAdvisor;