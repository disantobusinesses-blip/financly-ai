import React, { useState } from 'react';
import { Goal } from '../types';
import { TargetIcon, CalendarIcon } from './icon/Icon';
import { useAuth } from '../contexts/AuthContext';
import { getCurrencyInfo } from '../utils/currency';

interface AddGoalModalProps {
    onClose: () => void;
    onAddGoal: (newGoal: Omit<Goal, 'id' | 'currentAmount'>) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onAddGoal }) => {
    const { user } = useAuth();
    const { symbol } = getCurrencyInfo(user?.region);
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('🎯');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetAmount && targetDate) {
            onAddGoal({
                name,
                emoji,
                targetAmount: parseFloat(targetAmount),
                targetDate,
            });
            onClose();
        } else {
            alert('Please fill out all fields.');
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-content-bg p-8 rounded-xl border border-border-color w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
                    <TargetIcon className="h-6 w-6 mr-3 text-primary" />
                    Create a New Goal
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Goal Title</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="e.g., House Deposit"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="emoji" className="block text-sm font-medium text-text-secondary">Emoji</label>
                        <input
                            type="text"
                            id="emoji"
                            value={emoji}
                            onChange={e => setEmoji(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            maxLength={2}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="targetAmount" className="block text-sm font-medium text-text-secondary">Target Amount ({symbol})</label>
                        <input
                            type="number"
                            id="targetAmount"
                            value={targetAmount}
                            onChange={e => setTargetAmount(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="5000"
                            min="1"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="targetDate" className="block text-sm font-medium text-text-secondary">Target Date</label>
                        <div className="relative mt-1">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                id="targetDate"
                                value={targetDate}
                                onChange={e => setTargetDate(e.target.value)}
                                className="block w-full pl-10 px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover">
                            Add Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGoalModal;
