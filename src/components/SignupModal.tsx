import React, { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserMembershipType } from "../types";

const avatars = ["🚀", "🌊", "🪙", "🧠", "🌱", "💡", "🛡", "🧭"];

const socialProviders = [
  { id: "google", label: "Sign up with Google" },
  { id: "apple", label: "Continue with Apple" },
  { id: "microsoft", label: "Join with Microsoft" },
];

const planOptions: {
  id: UserMembershipType;
  title: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: "Basic",
    title: "Free Basic Account",
    tagline: "7-day guided showcase",
    description:
      "Preview Financly with one connected account. We'll blur advanced insights but highlight exactly what you could unlock.",
  },
  {
    id: "Pro",
    title: "My Finances Pro Account",
    tagline: "All-access, no limits",
    description:
      "Unlock the full suite instantly, including real-time forecasts, subscription hunter, and AI-powered coaching.",
  },
];

const genderOptions = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
];

const SignupModal: React.FC = () => {
  const { isSignupModalOpen, setIsSignupModalOpen, signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState<"AU" | "US">("AU");
  const [gender, setGender] = useState(genderOptions[0]);
  const [avatar, setAvatar] = useState(avatars[0]);
  const [membershipType, setMembershipType] = useState<UserMembershipType>(
    "Basic"
  );
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [quickLogin, setQuickLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isFormValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length >= 6 &&
      Boolean(membershipType)
    );
  }, [name, email, password, membershipType]);

  if (!isSignupModalOpen) return null;

  const handleSocialSignup = (provider: string) => {
    alert(
      `${provider} sign-up is coming soon. Use email sign-up today and link ${provider} later from your profile settings.`
    );
  };

  const handleSignup = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    setError(null);

    const success = signup({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      region,
      membershipType,
      gender,
      avatar,
    });

    if (!success) {
      setError("An account with this email already exists.");
      setSubmitting(false);
    } else {
      setSubmitting(false);
      setMarketingOptIn(true);
      setQuickLogin(false);
      setAvatar(avatars[0]);
      setGender(genderOptions[0]);
      setPassword("");
      setEmail("");
      setName("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="grid gap-6 bg-slate-50/60 px-6 py-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Create your Financly profile
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Pick a plan to begin. Basic gives you a 7-day guided showcase. Pro
              unlocks every insight instantly.
            </p>

            <div className="mt-4 space-y-3">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleSocialSignup(provider.label)}
                  className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary"
                >
                  {provider.label}
                </button>
              ))}
            </div>

            <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.35em] text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>Or build your account</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Jamie Rivera"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </label>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Email address
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="you@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </label>
            {membershipType === "Basic" && (
              <p className="mt-1 text-xs text-amber-600">
                Use a real email so we can confirm your 7-day showcase access.
              </p>
            )}

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Region
                <select
                  value={region}
                  onChange={(event) =>
                    setRegion(event.target.value as "AU" | "US")
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="AU">Australia</option>
                  <option value="US">United States</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Gender
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">
                Choose your avatar
              </p>
              <div className="mt-2 grid grid-cols-8 gap-2 sm:grid-cols-6">
                {avatars.map((symbol) => {
                  const isActive = avatar === symbol;
                  return (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => setAvatar(symbol)}
                      className={`flex h-12 w-full items-center justify-center rounded-xl border text-xl transition ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-200 bg-white text-slate-500 hover:border-primary/60"
                      }`}
                    >
                      {symbol}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              {planOptions.map((plan) => {
                const isSelected = membershipType === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setMembershipType(plan.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow"
                        : "border-slate-200 bg-white text-slate-600 hover:border-primary/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold">{plan.title}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {plan.tagline}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                  </button>
                );
              })}
            </div>

            {membershipType === "Basic" ? (
              <p className="mt-3 text-xs text-slate-500">
                Your free basic account stays active for 7 days. Financial
                Wellness, Goals, and Balance Summary remain visible while other
                insights stay blurred as a preview.
              </p>
            ) : (
              <p className="mt-3 text-xs text-emerald-600">
                Pro members unlock real-time forecasts, subscription hunter, AI
                savings coaching, and dedicated onboarding support.
              </p>
            )}

            <div className="mt-4 space-y-2">
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span>
                  Email me weekly budgeting tips, beta invites, and product
                  experiments from Financly.
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={quickLogin}
                  onChange={(event) => setQuickLogin(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span>
                  Remind me to enable Face ID / biometrics for one-tap logins
                  after my first connection.
                </span>
              </label>
            </div>

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900">
                A tour built around you
              </h3>
              <p className="text-sm text-slate-600">
                We walk through each dashboard tool with personalised examples
                once your bank data syncs. Swipe between cards on mobile or tap
                the floating magnifier to replay the tour anytime.
              </p>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>
                  • We pre-fill your profile with the avatar and gender you
                  choose so tour callouts feel personal.
                </li>
                <li>
                  • Showcase members see upgrade prompts inside each blurred
                  insight with potential savings highlighted.
                </li>
                <li>
                  • Pro members unlock AI summaries, subscription hunter, and
                  coaching from day one.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignup}
                disabled={!isFormValid || submitting}
                className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Creating your account..."
                  : membershipType === "Pro"
                  ? "Start with Pro"
                  : "Start your showcase"}
              </button>
              <button
                onClick={() => setIsSignupModalOpen(false)}
                className="w-full rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-600 transition hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <p className="text-center text-xs text-slate-400">
                By continuing you agree to Financly's terms and confirm that
                Financly AI offers general guidance only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
