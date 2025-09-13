import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CreditScoreProps {
  score: number;
}

const getScoreColor = (score: number, region: 'AU' | 'US' = 'AU') => {
  const excellent = region === 'US' ? 800 : 800;
  const good = region === 'US' ? 670 : 700;
  const fair = region === 'US' ? 580 : 625;
  
  if (score >= excellent) return 'text-secondary';
  if (score >= good) return 'text-green-500';
  if (score >= fair) return 'text-yellow-500';
  return 'text-red-500';
};

const getScoreRating = (score: number, region: 'AU' | 'US' = 'AU') => {
    if (region === 'US') {
        if (score >= 800) return 'Exceptional';
        if (score >= 740) return 'Very Good';
        if (score >= 670) return 'Good';
        if (score >= 580) return 'Fair';
        return 'Poor';
    } else { // AU
        if (score >= 800) return 'Excellent';
        if (score >= 700) return 'Very Good';
        if (score >= 625) return 'Good';
        if (score >= 550) return 'Fair';
        return 'Weak';
    }
}

const CreditScore: React.FC<CreditScoreProps> = ({ score }) => {
  const { user } = useAuth();
  const region = user?.region || 'AU';
  const scorePercentage = region === 'US' ? Math.max(0, (score - 300) / 550) : score / 1000;
  const displayPercentage = Math.round(scorePercentage * 100);
  const color = getScoreColor(score, region);
  const rating = getScoreRating(score, region);

  return (
    <div className="bg-content-bg p-6 rounded-xl border border-border-color">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Your Credit Score</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col justify-center items-center text-center p-4 rounded-lg bg-background">
            <span className={`text-7xl font-extrabold ${color}`}>{score}</span>
            <span className="font-bold text-lg text-text-secondary mt-1">{rating}</span>
            <div className="mt-4">
                <span className="text-3xl font-bold text-text-primary">{displayPercentage}%</span>
                <p className="text-xs text-text-tertiary">of maximum possible score</p>
            </div>
        </div>
        <div>
            <h3 className="font-bold text-text-primary mb-3">Key Factors</h3>
            <ul className="space-y-3 text-sm">
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary mr-3"></span><div><span className="font-semibold">Payment History:</span> Excellent</div></li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary mr-3"></span><div><span className="font-semibold">Credit Utilisation:</span> 15% (Very Good)</div></li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></span><div><span className="font-semibold">Length of Credit History:</span> 4 years (Fair)</div></li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary mr-3"></span><div><span className="font-semibold">Total Accounts:</span> 5 (Good)</div></li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary mr-3"></span><div><span className="font-semibold">Hard Inquiries:</span> 0 (Excellent)</div></li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default CreditScore;
