import React, { useEffect } from 'react';

const FiskilCallbackHandler: React.FC = () => {

  useEffect(() => {
    console.log("Fiskil Callback Handler Loaded.");
    try {
        const params = new URLSearchParams(window.location.search);
        const customerId = params.get('customerId');
        const error = params.get('error');

        if (error) {
            console.error('Fiskil connection failed with error:', error);
            localStorage.setItem('fiskilConnectionStatus', 'error');
        } else if (customerId) {
            console.log(`Fiskil connection completed with customer ID: ${customerId}`);
            const pendingCustomerId = localStorage.getItem('fiskilPendingCustomerId');

            if (pendingCustomerId) {
                console.log(`Found pending customer ID: ${pendingCustomerId}. Finalizing connection.`);
                localStorage.setItem('fiskilCustomerId', pendingCustomerId);
                localStorage.setItem('fiskilConnectionStatus', 'success');
                localStorage.removeItem('fiskilPendingCustomerId');
            } else {
                console.error("Fiskil callback successful, but no pending customer ID was found in localStorage.");
                localStorage.setItem('fiskilConnectionStatus', 'error');
            }
        } else {
            console.warn("Fiskil callback received without a 'customerId' or 'error' parameter. The user may have cancelled.");
            localStorage.setItem('fiskilConnectionStatus', 'cancelled');
        }
    } catch (e) {
        console.error("Error processing Fiskil callback:", e);
        localStorage.setItem('fiskilConnectionStatus', 'error');
    } finally {
        console.log("Closing callback window.");
        window.close();
    }
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-background">
      <div className="flex items-center">
        <svg className="animate-spin h-8 w-8 text-primary mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Finalizing Connection...</h1>
          <p className="text-text-secondary mt-1">This window will close automatically.</p>
        </div>
      </div>
    </div>
  );
};

export default FiskilCallbackHandler;
