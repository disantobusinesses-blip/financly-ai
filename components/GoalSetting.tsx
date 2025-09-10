import React, { useState } from 'react';
import { Goal } from '../types';
import { TargetIcon, PlusIcon } from './icons/Icons';
import AddGoalModal from './AddGoalModal';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

interface GoalSettingProps {
    goals: Goal[];
    totalSavings: number;
    onAddGoal: (newGoal: Omit<Goal, 'id' | 'currentAmount'>) => void;
}

const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
    const { user } = useAuth();
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const isComplete = progress >= 100;

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-border-color">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <span className="text-2xl mr-3">{goal.emoji}</span>
                    <span className="font-bold text-text-primary">{goal.name}</span>
                </div>
                {isComplete && (
                     <span className="text-xs font-bold bg-secondary text-white px-2 py-1 rounded-full">ACHIEVED</span>
                )}
            </div>
            <div className="flex items-center gap-4 mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
            </div>
            <p className="text-right text-sm text-text-secondary mt-1">
                {formatCurrency(goal.currentAmount, user?.region)} / {formatCurrency(goal.targetAmount, user?.region)}
            </p>
        </div>
    )
}

const GoalSetting: React.FC<GoalSettingProps> = ({ goals, totalSavings, onAddGoal }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    return (
        <div className="bg-content-bg p-6 rounded-xl border border-border-color h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <TargetIcon className="h-7 w-7 text-primary" />
                    <h2 className="text-2xl font-bold text-text-primary ml-3">Financial Goals</h2>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Goal</span>
                </button>
            </div>
             <div className="space-y-4">
                {goals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                ))}
             </div>
             {isModalOpen && (
                <AddGoalModal 
                    onClose={() => setIsModalOpen(false)} 
                    onAddGoal={onAddGoal} 
                />
            )}
        </div>
    );
};

export default GoalSetting;