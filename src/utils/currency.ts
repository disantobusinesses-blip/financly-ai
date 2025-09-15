import { User } from '../Types';

export const getCurrencyInfo = (region: User['region'] = 'AU') => {
    return region === 'US' 
        ? { symbol: '$', code: 'USD', locale: 'en-US' }
        : { symbol: 'A$', code: 'AUD', locale: 'en-AU' };
};

export const formatCurrency = (amount: number, region: User['region'] = 'AU') => {
    const { symbol, locale } = getCurrencyInfo(region);
    const formattedAmount = amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Handle negative amounts for credit cards, etc.
    if (formattedAmount.startsWith('-')) {
        return `-${symbol}${formattedAmount.slice(1)}`;
    }
    
    return `${symbol}${formattedAmount}`;
};
