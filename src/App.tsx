// src/App.tsx
import React from "react";

const App: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 text-white font-sans">
    <div className="flex flex-col items-center gap-6 text-center px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">F</div>
        <span className="text-2xl font-bold tracking-tight">Financly</span>
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight">Coming Soon</h1>
      <p className="text-lg text-neutral-400 max-w-md">
        We're working hard to bring you a smarter way to manage your finances. Stay tuned!
      </p>
      <div className="mt-4 h-1 w-24 rounded-full bg-primary" />
    </div>
  </div>
);

export default App;
