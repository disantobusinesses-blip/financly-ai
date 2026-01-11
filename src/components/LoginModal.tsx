import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleLogin = async () => {
    setSubmitting(true);
    const success = await login(email, password);
    if (!success) {
      setError("Invalid email or password.");
    } else {
      setError(null);
      setIsLoginModalOpen(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-md max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Login</h2>

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
          className="w-full p-2 border rounded mb-4 text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleLogin}
            disabled={submitting}
            className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
