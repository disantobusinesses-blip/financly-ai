import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const SignupModal: React.FC = () => {
  const { isSignupModalOpen, setIsSignupModalOpen, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState<"AU" | "US">("AU");
  const [error, setError] = useState<string | null>(null);

  if (!isSignupModalOpen) return null;

  const handleSignup = () => {
    const success = signup(email, password, region);
    if (!success) {
      setError("An account with this email already exists.");
    } else {
      setError(null);
      setIsSignupModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-md max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Sign Up</h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-3 text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-3 text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as "AU" | "US")}
          className="w-full p-2 border rounded mb-4 text-black"
        >
          <option value="AU">Australia</option>
          <option value="US">United States</option>
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsSignupModalOpen(false)}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSignup}
            className="px-4 py-2 rounded bg-primary text-white"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
