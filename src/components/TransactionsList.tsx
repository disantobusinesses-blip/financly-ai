
import React from 'react';
import { Transaction } from '../Types';
import { ArrowDownIcon, ArrowUpIcon } from './icon/Icon';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../

interface TransactionsListProps {
  transactions: Transaction[];
}

const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const { user } = useAuth();
    const isIncome = transaction.amount > 0;
    const amountColor = isIncome ? 'text-secondary' : 'text-text-primary';
    const amountPrefix = isIncome ? '+' : '-';
    const Icon = isIncome ? ArrowUpIcon : ArrowDownIcon;

    return (
        <li className="flex items-center justify-between py-4 border-b border-border-color last:border-b-0">
            <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${isIncome ? 'bg-secondary-light' : 'bg-gray-100 dark:bg-gray-800'}`}>
                   <Icon className={`${isIncome ? 'text-secondary' : 'text-text-secondary'}`} />
                </div>
                <div>
                    <p className="font-medium text-text-primary">{transaction.description}</p>
                    <p className="text-sm text-text-secondary">{transaction.category} &middot; {new Date(transaction.date).toLocaleDateString()}</p>
                </div>
            </div>
            <div className={`font-semibold ${amountColor}`}>
                {amountPrefix} {formatCurrency(Math.abs(transaction.amount), user?.region).replace(/[A-Z]+\$/, '$')}
            </div>
        </li>
    )
}


const TransactionsList: React.FC<TransactionsListProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
        <div className="text-center py-12">
            <p className="text-text-secondary font-medium">No Transactions Found</p>
            <p className="text-sm text-text-tertiary mt-1">Try adjusting your search or filters.</p>
        </div>
    );
  }

  return (
    <ul>
      {transactions.map(transaction => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </ul>
  );
};

export default TransactionsList;
