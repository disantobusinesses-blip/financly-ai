import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon } from './icon/Icon';

const Checkmark: React.FC = () => (
  <svg className="h-5 w-5 text-secondary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-center gap-3">
    <Checkmark />
    <span className="text-text-primary">{children}</span>
  </li>
);

const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen } = useAuth();

  if (!isUpgradeModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
      onClick={() => setIsUpgradeModalOpen(false)}
    >
      <div
        className="bg-content-bg p-8 rounded-xl border border-border-color w-full max-w-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <SparklesIcon className="h-10 w-10 text-primary mx-auto mb-2" />
          <h2 className="text-3xl font-bold text-text-primary">You're Already All Access</h2>
          <p className="text-text-secondary mt-2">
            Financly AI insights, automations, and guidance are now available to every member without an upgrade.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="border border-border-color rounded-lg p-6 bg-background">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Included Tools</h3>
            <ul className="space-y-3 text-sm">
              <Feature>AI Spending Insights</Feature>
              <Feature>Financial Watchdog Alerts</Feature>
              <Feature>Smart Subscription Hunter</Feature>
              <Feature>Borrowing Power Guidance</Feature>
              <Feature>Goal-Based Savings Plans</Feature>
              <Feature>Forecasting & Cashflow Tracking</Feature>
            </ul>
          </div>
          <div className="border border-border-color rounded-lg p-6 bg-background">
            <h3 className="text-xl font-semibold text-text-primary mb-4">What to Do Next</h3>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>1. Connect your bank accounts with Basiq to sync live data.</li>
              <li>2. Visit the dashboard to explore insights across every widget.</li>
              <li>3. Set goals and let Financly highlight personalized actions.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => setIsUpgradeModalOpen(false)}
            className="w-full bg-primary text-primary-text font-semibold py-3 rounded-lg hover:bg-primary-hover transition-colors text-lg"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
