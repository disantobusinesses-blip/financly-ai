
import React from 'react';

const SyncingOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100]">
            <div className="bg-content-bg p-8 rounded-xl border border-border-color text-center shadow-2xl">
                <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="text-xl font-bold text-text-primary">Connection Successful!</h2>
                <p className="text-text-secondary mt-2">Syncing your financial data. This may take a moment...</p>
            </div>
        </div>
    );
}

export default SyncingOverlay;
