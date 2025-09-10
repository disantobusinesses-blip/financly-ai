import React from 'react';

const ConnectBankPage: React.FC = () => {
    // This component is now obsolete due to the new "fetch-then-open" architecture.
    // The logic has been moved to the Header component for better reliability.
    return (
        <div className="flex flex-col h-screen bg-background text-text-primary p-4 justify-center items-center text-center">
            <h1 className="text-2xl font-bold">This page is no longer in use.</h1>
            <p className="text-text-secondary mt-2">
                This connection method has been replaced with a more reliable process. 
                Please close this tab and try connecting again from the main dashboard.
            </p>
             <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
                Close Window
            </button>
        </div>
    );
};

export default ConnectBankPage;