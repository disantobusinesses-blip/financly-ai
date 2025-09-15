import React, { useState, useEffect, useRef } from 'react';
// FIX: Corrected import casing to match file system.
import { getBorrowingPower, BorrowingPowerResult } from '../services/GeminiService';
import { LoanIcon, SparklesIcon, ArrowRightIcon } from './icon/Icon';
import { useOnScreen } from '../hooks/useOnScreen';
// FIX: Corrected import casing to match file system.
import { useAuth } from '../contexts/AuthContext';
import ProFeatureBlocker from './ProFeatureBlocker';
import { formatCurrency } from '../utils/currency';

interface BorrowingPowerProps {
  creditScore: number;
  totalIncome: number;
  totalBalance: number;
}

const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-4"></div>
    </div>
);

const BorrowingPower: React.FC<BorrowingPowerProps> = ({ creditScore, totalIncome, totalBalance }) => {
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);
  const [analysis, setAnalysis] = useState<BorrowingPowerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brokerReferralUrl = user?.region === 'US' 
    ? "https://www.nerdwallet.com/personal-loans"
    : "https://hbsfinancialgroup.com.au/";

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (isVisible && !hasFetched && user) {
        setIsLoading(true);
        setHasFetched(true);
        setError(null);
        try {
          const result = await getBorrowingPower(creditScore, totalIncome, totalBalance, user.region);
          setAnalysis(result);
        } catch (err) {
          console.error(err);
          setError("Could not load AI borrowing power analysis.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAnalysis();
  }, [isVisible, hasFetched, creditScore, totalIncome, totalBalance, user]);

  return (
    <div className="bg-content-bg p-6 rounded-xl border border-border-color" ref={ref}>
      <div className="flex items-center mb-6">
        <LoanIcon className="h-7 w-7 text-primary" />
        <h2 className="text-2xl font-bold text-text-primary ml-3">AI Borrowing Power</h2>
      </div>

      <div>
        <h3 className="font-bold text-text-primary mb-3">Your AI Estimated Capacity</h3>
         {user?.membershipType === 'Pro' ? (
             <>
                {isLoading && <LoadingSkeleton />}
                {error && <p className="text-red-500">{error}</p>}
                {analysis && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-text-secondary">Estimated Loan Amount</p>
                            <p className="text-4xl font-extrabold text-primary">{formatCurrency(analysis.estimatedLoanAmount, user?.region)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Estimated Interest Rate</p>
                            <p className="text-2xl font-bold text-text-primary">{analysis.estimatedInterestRate.toFixed(2)}% p.a.</p>
                        </div>
                        <div className="flex items-start gap-2 pt-2">
                            <SparklesIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-text-secondary italic">{analysis.advice}</p>
                        </div>
                        <div className="pt-4">
                        <a
                            href={brokerReferralUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors text-base"
                            >
                            <span>Explore Loan Options</span>
                            <ArrowRightIcon />
                            </a>
                        </div>
                    </div>
                )}
             </>
         ) : (
             <ProFeatureBlocker
                featureTitle="Borrowing Power"
                teaserText={!analysis && !isLoading ? "Analyzing your borrowing potential..." : `See your estimated borrowing power!`}
             >
                <LoadingSkeleton />
             </ProFeatureBlocker>
         )}
      </div>
    </div>
  );
};

export default BorrowingPower;