import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  onSuccess: () => void;
}

const LoginPage: React.FC<Props> = ({ onSuccess }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await login(email.trim(), password);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess();
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <div className="space-y-2">
          <label className="text-sm text-white/80">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/80">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:border-primary focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-rose-200">{error}</p>}
        <button
          type="submit"
          className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
          disabled={loading}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
