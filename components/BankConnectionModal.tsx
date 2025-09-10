import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { initiateBankConnection } from '../services/bankingService';
import { initiatePlaidConnection } from '../services/plaidService';

interface BankConnectionModalProps {
    onSuccess: () => void;
    onClose: () => void;
}

const BankConnectionModal: React.FC<BankConnectionModalProps> = ({ onSuccess, onClose }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        // This component is part of a deprecated flow and should not be used.
        // It's maintained in the codebase to prevent breaking changes if referenced,
        // but it will immediately enter an error state. The correct flow is the
        // redirect flow initiated by ConnectBankPage.tsx.
        setStatus('error');
        setErrorMessage("This connection method is deprecated. Please use the 'Connect Bank' button, which opens a new tab.");
    }, []);


    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
        >
            <div 
                className="bg-content-bg rounded-xl border border-border-color w-full max-w-lg h-[80vh] flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-border-color flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-text-primary">Connect Your Bank</h2>
                    <button 
                        onClick={onClose} 
                        className="text-text-secondary hover:text-text-primary text-2xl font-bold leading-none w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>
                <div className="flex-1 p-4 relative overflow-auto">
                    {status === 'loading' && (
                        <div className="absolute inset-0 flex flex-col justify-center items-center">
                            <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-text-secondary">Preparing secure connection...</p>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
                            <p className="text-red-500 font-medium">{errorMessage}</p>
                        </div>
                    )}
                     <div 
                        id="basiq-connect-container" 
                        className="w-full h-full min-h-[500px]"
                        style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }}
                    >
                        {/* Basiq Connect iframe would be injected here in the old flow */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankConnectionModal;