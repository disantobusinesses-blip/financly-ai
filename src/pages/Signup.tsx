import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const SignupPage: React.FC = () => {
  const { signup, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await signup({ email: email.trim(), password, fullName: fullName.trim() });
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.requiresEmailConfirmation) {
      setConfirmation(true);
      return;
    }
    window.location.replace("/onboarding");
  };

  if (confirmation) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 text-white">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-white/70">Confirm your email to continue onboarding.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <div className="space-y-2">
          <label className="text-sm text-white/80">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-white/60"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/80">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-white/60"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/80">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-white/60"
            required
          />
        </div>
        {error && <p className="text-sm text-rose-200">{error}</p>}
        <button
          type="submit"
          className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
          disabled={loading}
        >
          Sign up
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
