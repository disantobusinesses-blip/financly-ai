import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, openSignupModal } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const success = login(email, password);
    setIsSubmitting(false);
    if (!success) {
      setError("We couldn't find that combination. Try again or create a profile.");
    } else {
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 text-gray-900 shadow-2xl dark:bg-neutral-900 dark:text-white md:p-8">
        <button
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close login"
        >
          ✕
        </button>

        <header className="mb-6 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">Welcome back</p>
          <h2 className="text-3xl font-bold">Log in to Financly AI</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the credentials you used for your showcase or Pro account.
          </p>
        </header>

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary/40 hover:text-primary dark:border-neutral-700 dark:text-gray-200">
            <span>🔐</span> Sign in with Google
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary/40 hover:text-primary dark:border-neutral-700 dark:text-gray-200">
            <span>🍎</span> Sign in with Apple
          </button>
        </div>

        <div className="relative mb-5 text-center text-xs uppercase tracking-widest text-gray-400 before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:-translate-y-1/2 before:bg-gray-200 dark:text-gray-500 dark:before:bg-neutral-700">
          <span className="relative bg-white px-3 dark:bg-neutral-900">or continue with email</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Checking credentials..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          New here? <button onClick={() => { setIsLoginModalOpen(false); openSignupModal(); }} className="font-semibold text-primary hover:underline">Create a showcase</button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
