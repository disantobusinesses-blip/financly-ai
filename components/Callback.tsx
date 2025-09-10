

import React, { useEffect } from 'react';

const Callback: React.FC = () => {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const basiqUserId = params.get('user_id'); // Basiq passes 'user_id' upon successful connection

    if (basiqUserId) {
      console.log(`Basiq connection successful for user ID: ${basiqUserId}`);
      // Store the ID so we can fetch real data for this user later.
      localStorage.setItem('basiqUserId', basiqUserId);
    } else {
        console.warn("Basiq callback was called without a user_id parameter.");
    }

    // Redirect back to the dashboard to show the new data.
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 1500); // Redirect after 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-full text-center">
      <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h1 className="text-3xl font-bold text-text-primary">Finalizing Connection</h1>
      <p className="text-text-secondary mt-2">Please wait while we securely connect your account. You will be redirected shortly.</p>
    </div>
  );
};

export default Callback;