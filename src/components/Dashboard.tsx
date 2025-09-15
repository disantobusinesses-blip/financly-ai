import React, { useState, useEffect, useMemo } from 'react';
// FIX: Corrected import casing to match file system.
import { Account, Transaction, Goal, SavingsPlan, AccountType } from '../types';
// FIX: Corrected import casing to match file system.
import { getAccounts, getTransactions, getCreditScore } from '../services/BankingService';
// FIX: Corrected import casing to match file system.
import { getSavingsPlan } from '../services/GeminiService';
import AccountCard from './AccountCard';
import TransactionAnalysis from './TransactionAnalysis';
import CreditScore from './CreditScore';
import BorrowingPower from './BorrowingPower';
import FinancialAlerts from './FinancialAlerts';
import GoalSetting from './GoalSetting';
import AISavingsPlan from './AISavingsPlan';
import SpendingForecast from './SpendingForecast';
import { useAuth } from '../contexts/AuthContext';
// FIX: Corrected import casing to match file system.
import { formatCurrency } from '../utils/currency';

const demoGoals: Goal[] = [];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditScore, setCreditScore] = useState<number>(0);
  const [goals, setGoals] = useState<Goal[]>(demoGoals);
  const [savingsPlan, setSavingsPlan] = useState<SavingsPlan | null>(null);
  const [isSavingsPlanLoading, setIsSavingsPlanLoading] = useState(true);
  const [savingsPlanError, setSavingsPlanError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const primaryGoal = useMemo(() => goals.find(g => g.currentAmount < g.targetAmount), [goals]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [accountsData, transactionsData, creditScoreData] = await Promise.all([
          getAccounts(),
          getTransactions(),
          getCreditScore(),
        ]);
        setAccounts(accountsData);
        setTransactions(transactionsData);
        setCreditScore(creditScoreData);
      } catch (err) {
        setError('Failed to fetch financial data. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchSavingsPlan = async () => {
      if (user && primaryGoal && transactions.length > 0 && accounts.length > 0) {
        setIsSavingsPlanLoading(true);
        setSavingsPlanError(null);
        try {
          const result = await getSavingsPlan(transactions, primaryGoal, accounts, user.region);
          setSavingsPlan(result);
        } catch (err) {
          console.error(err);
          setSavingsPlanError("Could not load AI Savings Plan.");
        } finally {
          setIsSavingsPlanLoading(false);
        }
      } else if (!primaryGoal) {
        setIsSavingsPlanLoading(false);
      }
    };
    fetchSavingsPlan();
  }, [primaryGoal, transactions, accounts, user]);


  const totalBalance = useMemo(() => 
    accounts.reduce((total, acc) => {
        if (acc.type === AccountType.CREDIT_CARD || acc.type === AccountType.LOAN) {
            return total - acc.balance;
        }
        return total + acc.balance;
    }, 0),
  [accounts]);

  const totalSavings = useMemo(() =>
    accounts.filter(acc => acc.type === AccountType.SAVINGS).reduce((sum, acc) => sum + acc.balance, 0),
  [accounts]);
  
  const totalIncome = useMemo(() => 
    transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
  [transactions]);

  const handleAddGoal = (newGoal: Omit<Goal, 'id' | 'currentAmount'>) => {
    setGoals(prevGoals => [
        ...prevGoals,
        {
            ...newGoal,
            id: `goal_${Date.now()}`,
            currentAmount: 0
        }
    ]);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><div className="text-xl text-text-secondary">Loading your financial dashboard...</div></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full"><div className="text-xl text-red-500">{error}</div></div>;
  }
  
  return (
    <div className="space-y-6">
      {/* --- Section: Overview --- */}
      <section id="overview" className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Overview</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
              <CreditScore score={creditScore} />
          </div>
          <div className="space-y-6">
               <div className="bg-content-bg p-6 rounded-xl border border-border-color">
                  <h2 className="text-sm font-semibold text-text-secondary mb-1">Total Net Worth</h2>
                  <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalBalance, user?.region)}</p>
              </div>
              <div className="bg-content-bg p-6 rounded-xl border border-border-color">
                  <h2 className="text-sm font-semibold text-text-secondary mb-1">Total Savings</h2>
                  <p className="text-2xl font-bold text-secondary">{formatCurrency(totalSavings, user?.region)}</p>
              </div>
          </div>
        </div>
      </section>

      {/* --- Section: Forecast --- */}
      <section id="spending-forecast">
        <SpendingForecast 
          transactions={transactions} 
          totalBalance={totalBalance}
          savingsPlan={savingsPlan}
        />
      </section>

      {/* --- Section: AI Tools Grid (Alerts & Borrowing Power) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section id="alerts" className="h-full">
            <FinancialAlerts transactions={transactions} />
          </section>
          <section id="borrowing-power" className="h-full">
              <BorrowingPower 
                creditScore={creditScore} 
                totalIncome={totalIncome} 
                totalBalance={totalBalance}
              />
          </section>
      </div>

      {/* --- Section: Financial Plan --- */}
      <section id="financial-plan" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalSetting goals={goals} totalSavings={totalSavings} onAddGoal={handleAddGoal} />
              {primaryGoal ? (
                <AISavingsPlan 
                  goal={primaryGoal} 
                  plan={savingsPlan}
                  isLoading={isSavingsPlanLoading}
                  error={savingsPlanError}
                />
              ) : (
                <div className="bg-content-bg p-6 rounded-xl border border-border-color flex items-center justify-center h-full">
                    <p className="text-text-secondary text-center">Set a new goal to generate an AI savings plan!</p>
                </div>
              )}
          </div>
      </section>

      {/* --- Section: Accounts Overview --- */}
      <section id="accounts-overview" className="bg-content-bg p-6 rounded-xl border border-border-color">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Accounts Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {accounts.map(account => (
                <AccountCard key={account.id} account={account} />
             ))}
          </div>
      </section>
      
      {/* --- Section: Transactions --- */}
      <section id="transactions">
        <TransactionAnalysis transactions={transactions} />
      </section>
    </div>
  );
};

export default Dashboard;
