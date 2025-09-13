import React from 'react';
import { Goal, SavingsPlan } from '../types';
import { SparklesIcon, ScissorsIcon, CalendarIcon, TrendingUpIcon } from './icon/Icon';
import { useAuth } from '../contexts/AuthContext';
import ProFeatureBlocker from './ProFeatureBlocker';
import { formatCurrency } from '../utils/currency';

interface AISavingsPlanProps {
    goal: Goal;
    plan: SavingsPlan | null;
    isLoading: boolean;
    error: string | null;
}

const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
);

const AISavingsPlan: React.FC<AISavingsPlanProps> = ({ goal, plan, isLoading, error }) => {
    const { user } = useAuth();

    return (
        <div className="bg-content-bg p-6 rounded-xl border border-border-color h-full">
            <div className="flex items-center mb-6">
                <SparklesIcon className="h-7 w-7 text-primary" />
                <h2 className="text-2xl font-bold text-text-primary ml-3">AI Savings Plan</h2>
            </div>
            
            {user?.membershipType === 'Pro' ? (
                 <>
                    {isLoading ? <LoadingSkeleton /> :
                    error ? <p className="text-red-500">{error}</p> :
                    plan ? (
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-text-secondary">Based on your goal to save for your <span className="font-bold text-text-primary">{goal.name}</span>, here's how you can get there faster:</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-text-primary mb-3">AI-Powered Suggestions</h3>
                                <ul className="space-y-3">
                                {plan.suggestions.map((s, i) => {
                                    const isGain = s.category === 'Capital Growth';
                                    return (
                                        <li key={i} className="flex justify-between items-center p-3 bg-background rounded-md border border-border-color">
                                            <div className="flex items-center">
                                                {isGain ? <TrendingUpIcon className="h-5 w-5 mr-3 text-secondary flex-shrink-0" /> : <ScissorsIcon className="h-5 w-5 mr-3 text-primary flex-shrink-0" />}
                                                <div>
                                                    <p className="font-semibold text-text-primary">{s.category}</p>
                                                    <p className="text-xs text-text-secondary">{s.description}</p>
                                                </div>
                                            </div>
                                            {isGain ? (
                                                <p className="font-bold text-secondary text-right whitespace-nowrap">+{formatCurrency(s.monthlyCut, user?.region)}</p>
                                            ) : (
                                                <p className="font-bold text-red-500 text-right whitespace-nowrap">-{formatCurrency(s.monthlyCut, user?.region)}</p>
                                            )}
                                        </li>
                                    );
                                })}
                                </ul>
                            </div>
                            <div className="bg-primary-light p-4 rounded-lg text-center">
                                <p className="text-sm text-primary font-medium">Following this plan could save you an extra</p>
                                <p className="text-3xl font-extrabold text-primary my-1">{formatCurrency(plan.totalMonthlySavings, user?.region)}/month</p>
                                <div className="flex items-center justify-center gap-2 text-primary font-bold">
                                    <CalendarIcon className="h-5 w-5"/>
                                    <span>New Goal Date: {new Date(plan.newGoalDate).toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })} ({plan.monthsSaved} months faster!)</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-text-secondary">No savings plan available. Set a new goal to get started!</p>
                    )}
                </>
            ) : (
                <ProFeatureBlocker
                    featureTitle="AI Savings Plan"
                    teaserText={!plan ? "Analyzing your potential savings..." : `Upgrade now to see how you can save an extra ${formatCurrency(plan?.totalMonthlySavings || 0, user?.region)} per month!`}
                >
                    <div className="space-y-6">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mt-4"></div>
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-full mt-4"></div>
                    </div>
                </ProFeatureBlocker>
            )}
        </div>
    );
};

export default AISavingsPlan;
