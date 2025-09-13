import React from 'react';
import { Account, AccountType } from '../types';
import { BankIcon, CardIcon } from './icon/Icon';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

interface AccountCardProps {
  account: Account;
}

const getIconForAccountType = (type: AccountType) => {
    switch (type) {
        case AccountType.CREDIT_CARD:
            return <CardIcon className="h-6 w-6 text-text-tertiary" />;
        case AccountType.CHECKING:
        case AccountType.SAVINGS:
        default:
            return <BankIcon className="h-6 w-6 text-text-tertiary" />;
    }
};

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const { user } = useAuth();
  return (
    <div className="bg-content-bg p-6 rounded-xl border border-border-color flex flex-col justify-between hover:border-primary hover:shadow-lg transition-all duration-300">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-text-secondary font-medium">{account.name}</span>
          {getIconForAccountType(account.type)}
        </div>
        <p className="text-sm text-text-tertiary">{account.type}</p>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-text-primary">{formatCurrency(account.balance, user?.region)}</p>
        <p className="text-sm text-text-secondary">{account.currency}</p>
      </div>
    </div>
  );
};

export default AccountCard;
