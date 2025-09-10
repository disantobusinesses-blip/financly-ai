import React, { useEffect } from 'react';

const BasiqCallbackHandler: React.FC = () => {

  useEffect(() => {
    console.log("Basiq Callback Handler Loaded.");
    try {
        // Basiq returns parameters in the main search part of the URL, even when using a hash for routing.
        const params = new URLSearchParams(window.location.search);
        const jobId = params.get('jobId') || params.get('jobIds'); // Basiq sometimes uses plural
        const error = params.get('error');

        if (error) {
            console.error('Basiq connection failed with error:', error);
            localStorage.setItem('basiqConnectionStatus', 'error');
        } else if (jobId) {
            console.log(`Basiq job completed successfully with ID: ${jobId}`);
            const pendingUserId = localStorage.getItem('basiqPendingUserId');

            if (pendingUserId) {
                console.log(`Found pending user ID: ${pendingUserId}. Finalizing connection.`);
                // Set the permanent user ID and the success status
                localStorage.setItem('basiqUserId', pendingUserId);
                localStorage.setItem('basiqConnectionStatus', 'success');
                // Clean up the temporary ID
                localStorage.removeItem('basiqPendingUserId');
            } else {
                console.error("Basiq callback successful, but no pending user ID was found in localStorage.");
                localStorage.setItem('basiqConnectionStatus', 'error');
            }
        } else {
            console.warn("Basiq callback received without a 'jobId' or 'error' parameter. The user may have cancelled.");
            localStorage.setItem('basiqConnectionStatus', 'cancelled');
        }
    } catch (e) {
        console.error("Error processing Basiq callback:", e);
        localStorage.setItem('basiqConnectionStatus', 'error');
    } finally {
        // Always close the window. The main tab is polling localStorage to detect the change.
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

export default BasiqCallbackHandler;
