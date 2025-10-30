
import React, { useMemo } from 'react';
import { LoanIcon, SparklesIcon, ArrowRightIcon } from './icon/Icon';
import { useAuth } from '../contexts/AuthContext';
import ProFeatureBlocker from './ProFeatureBlocker';
import { formatCurrency } from '../utils/currency';

interface BorrowingPowerProps {
  creditScore: number;
  totalIncome: number;
  totalBalance: number;
}

const BorrowingPower: React.FC<BorrowingPowerProps> = ({ creditScore, totalIncome, totalBalance }) => {
  const { user } = useAuth();

  const brokerReferralUrl = user?.region === 'US'
    ? "https://www.nerdwallet.com/personal-loans"
    : "https://hbsfinancialgroup.com.au/";

  const analysis = useMemo(() => {
    const safeScore = Number.isFinite(creditScore) ? Math.max(300, Math.min(creditScore, 900)) : 650;
    const income = Number.isFinite(totalIncome) ? Math.max(totalIncome, 0) : 0;
    const netWorth = Number.isFinite(totalBalance) ? totalBalance : 0;

    const incomeCapacity = income * 4.5;
    const netWorthBoost = netWorth > 0 ? netWorth * 0.25 : 0;
    const estimatedLoanAmount = Math.max(0, incomeCapacity + netWorthBoost);

    let estimatedInterestRate = 6.5;
    if (safeScore >= 800) {
      estimatedInterestRate = 4.2;
    } else if (safeScore >= 740) {
      estimatedInterestRate = 4.9;
    } else if (safeScore >= 680) {
      estimatedInterestRate = 5.6;
    } else if (safeScore >= 620) {
      estimatedInterestRate = 6.3;
    }

    const advice = safeScore >= 740
      ? "Strong credit and steady income put you in a prime range—compare lenders to lock in the best rate."
      : safeScore >= 680
      ? "A little credit clean-up or extra savings could unlock better offers—consider trimming card balances before applying."
      : "Focus on shrinking revolving debt and building a larger buffer so lenders see a safer profile.";

    return {
      estimatedLoanAmount,
      estimatedInterestRate,
      advice,
      disclaimer: "This is not financial advice.",
    };
  }, [creditScore, totalIncome, totalBalance]);

  return (
    <div className="bg-content-bg p-6 rounded-xl border border-border-color h-full">
      <div className="flex items-center mb-6">
        <LoanIcon className="h-7 w-7 text-primary" />
        <h2 className="text-2xl font-bold text-text-primary ml-3">AI Borrowing Power</h2>
      </div>

      <div>
        <h3 className="font-bold text-text-primary mb-3">Your AI Estimated Capacity</h3>
         {user?.membershipType === 'Pro' ? (
           <div className="space-y-4">
             <div>
               <p className="text-sm text-text-secondary">Estimated Loan Amount</p>
               <p className="text-3xl font-extrabold text-primary">{formatCurrency(analysis.estimatedLoanAmount, user?.region)}</p>
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
             <p className="text-xs text-text-secondary/70">{analysis.disclaimer}</p>
           </div>
         ) : (
           <ProFeatureBlocker
             featureTitle="Borrowing Power"
             teaserText="See tailored borrowing estimates when you upgrade."
           >
             <div className="space-y-4 text-sm text-text-secondary">
               <p>Upgrade to forecast how much lenders may offer based on your score and income mix.</p>
               <p className="text-xs text-text-secondary/70">Estimates are informational only and not financial advice.</p>
             </div>
           </ProFeatureBlocker>
         )}
      </div>
    </div>
  );
};

export default BorrowingPower;
