import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon } from './icon/Icon';
import { createCheckoutSession } from '../services/StripeService';

const Checkmark: React.FC = () => (
  <svg className="h-5 w-5 text-secondary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const Xmark: React.FC = () => (
  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const Feature: React.FC<{ children: React.ReactNode; included: boolean }> = ({ children, included }) => (
  <li className="flex items-center gap-3">
    {included ? <Checkmark /> : <Xmark />}
    <span className={included ? 'text-text-primary' : 'text-text-tertiary'}>{children}</span>
  </li>
);

const UpgradeModal: React.FC = () => {
  const { user, isUpgradeModalOpen, setIsUpgradeModalOpen, upgradeUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceString = user?.region === 'US' ? "$9.99 USD" : "A$14.99 AUD";

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('payment') === 'success' && user) {
      console.log("Payment successful! Upgrading user.");
      upgradeUser(user.id);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [user, upgradeUser]);

  if (!isUpgradeModalOpen) return null;

  const handleUpgrade = async () => {
    if (!user) {
      setError("You must be logged in to upgrade.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(user);

      // ✅ Replace new-tab open with direct redirect
      window.location.href = url;

    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setIsUpgradeModalOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={() => setIsUpgradeModalOpen(false)}
    >
      <div
        className="bg-content-bg p-8 rounded-xl border border-border-color w-full max-w-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <SparklesIcon className="h-10 w-10 text-primary mx-auto mb-2" />
          <h2 className="text-3xl font-bold text-text-primary">Upgrade to MyAiBank Pro</h2>
          <p className="text-text-secondary mt-2">Unlock the full power of AI to supercharge your finances.</p>
          <p className="text-xs uppercase tracking-[0.3em] text-primary mt-2">
            7-day free trial • credit card required • cancel anytime
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-8">
          {/* Basic Plan */}
          <div className="border border-border-color rounded-lg p-6">
            <h3 className="text-xl font-bold text-text-primary">Basic Showcase</h3>
            <p className="text-text-secondary">7-day preview with blurred AI insights.</p>
            <p className="text-3xl font-bold my-4 text-text-primary">$0 <span className="text-lg font-medium text-text-secondary">/ 7 days</span></p>
            <ul className="space-y-3 text-sm">
              <Feature included={true}>Account & Transaction Sync</Feature>
              <Feature included={true}>Credit Score Monitoring</Feature>
              <Feature included={true}>Manual Goal Setting</Feature>
              <Feature included={false}>AI Spending Insights</Feature>
              <Feature included={false}>AI Financial Watchdog</Feature>
              <Feature included={false}>AI Savings Planner</Feature>
              <Feature included={false}>AI Borrowing Power</Feature>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-primary rounded-lg p-6 relative bg-primary-light">
            <span className="absolute -top-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>
            <h3 className="text-xl font-bold text-primary">MyAiBank Pro</h3>
            <p className="text-primary/80 dark:text-primary">All features, powered by AI.</p>
            <p className="text-3xl font-bold my-4 text-primary">{priceString} <span className="text-lg font-medium text-text-secondary">/ month</span></p>
            <ul className="space-y-3 text-sm">
              <Feature included={true}>Account & Transaction Sync</Feature>
              <Feature included={true}>Credit Score Monitoring</Feature>
              <Feature included={true}>Manual Goal Setting</Feature>
              <Feature included={true}>AI Spending Insights</Feature>
              <Feature included={true}>AI Financial Watchdog</Feature>
              <Feature included={true}>AI Savings Planner</Feature>
              <Feature included={true}>AI Borrowing Power</Feature>
              <Feature included={true}>7-day free trial before billing</Feature>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-primary text-primary-text font-semibold py-3 rounded-lg hover:bg-primary-hover transition-colors text-lg disabled:bg-gray-400 disabled:cursor-wait"
          >
            {isLoading ? 'Redirecting to payment...' : 'Upgrade Now & Unlock All Features'}
          </button>
          <button
            onClick={() => setIsUpgradeModalOpen(false)}
            className="w-full text-text-secondary font-medium py-2 mt-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Maybe Later
          </button>
          <p className="mt-4 text-center text-xs text-text-secondary">
            After your 7-day trial ends, your selected plan renews automatically each month unless you cancel. Trial status is
            visible on your dashboard header.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
