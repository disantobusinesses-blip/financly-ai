

import React, { useState, useEffect } from 'react';
import { BankIcon, MoonIcon, SunIcon, SparklesIcon } from './icon/Icon';
// FIX: Corrected import casing to match file system.
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
// FIX: Corrected import casing to match file system.
import { initiateBankConnection } from '../services/BankingService';

interface HeaderProps {
  setShowSyncing: (show: boolean) => void;
}

const Header = ({ setShowSyncing }: HeaderProps) => {
  const { user, upgradeUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Polling is more reliable than the 'storage' event in some sandboxed/iframe environments.
    const intervalId = setInterval(() => {
        const status = localStorage.getItem('basiqConnectionStatus');
        
        if (status) {
            // We've received a signal, so stop polling.
            clearInterval(intervalId);
            localStorage.removeItem('basiqConnectionStatus');
            
            if (status === 'success') {
                setShowSyncing(true);
                // Reload the page to fetch new data after a short delay for the overlay
                setTimeout(() => window.location.reload(), 2500);
            } else {
                setConnectionError("The bank connection process was not completed. Please try again.");
            }
        }
    }, 500); // Check every half a second

    // Cleanup on component unmount
    return () => clearInterval(intervalId);
}, [setShowSyncing]);


  const handleConnectBankClick = async () => {
    if (!user) {
      setConnectionError('You must be logged in to connect a bank account.');
      return;
    }
    setConnectionError(null);
    setIsConnecting(true);
    try {
      // 1. Fetch the secure consent URL and the Basiq User ID from the backend.
      const { consentUrl, userId } = await initiateBankConnection(user.email);
      
      // 2. CRITICAL: Save the Basiq User ID before redirecting.
      // The callback page will need this ID to finalize the connection.
      localStorage.setItem('basiqPendingUserId', userId);
      
      // 3. Once we have the URL, open it directly in a new tab.
      window.open(consentUrl, '_blank', 'noopener');

    } catch (err: any) {
      console.error("Failed to initiate bank connection:", err);
      setConnectionError(err.message || "Could not start the bank connection process. Please check if the backend server is running.");
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleDevUpgrade = () => {
    if (user) {
      upgradeUser(user.id);
    }
  };

  if (!user) return null;

  return (
    <>
      <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 bg-content-bg border-b border-border-color relative">
         {connectionError && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50 shadow-lg" role="alert">
                <span className="block sm:inline">{connectionError}</span>
            </div>
        )}
        <div className="flex items-center space-x-4">
           <div className="flex items-center gap-3">
              <img src={`https://i.pravatar.cc/40?u=${user.email}`} alt="User avatar" className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-bold text-text-primary capitalize">{user.email.split('@')[0]}</div>
                <div className={`text-sm font-semibold ${user.membershipType === 'Pro' ? 'text-primary' : 'text-text-secondary'}`}>{user.membershipType} Member</div>
              </div>
           </div>
        </div>
        <div className="flex items-center space-x-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon className="h-6 w-6 text-text-secondary" /> : <SunIcon className="h-6 w-6 text-text-secondary" />}
          </button>

          {user.membershipType === 'Free' && (
             <button
               onClick={handleDevUpgrade}
               className="p-2 rounded-full hover:bg-primary-light transition-colors group relative"
               aria-label="Developer Upgrade to Pro"
               title="Dev: Upgrade to Pro"
             >
               <SparklesIcon className="h-6 w-6 text-primary" />
             </button>
          )}

          <div className="w-px h-8 bg-border-color"></div>

          <button
            onClick={handleConnectBankClick}
            disabled={isConnecting}
            className="bg-primary text-primary-text font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center min-w-[150px] disabled:bg-gray-400 disabled:cursor-wait"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <BankIcon className="h-5 w-5 mr-2" />
                Connect Bank
              </>
            )}
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;