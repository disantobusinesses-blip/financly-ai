import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const steps = [
  { key: "firstName", label: "First name", type: "text", placeholder: "Enter your first name" },
  { key: "lastName", label: "Last name", type: "text", placeholder: "Enter your surname" },
  { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone number", type: "tel", placeholder: "+61 400 000 000" },
  { key: "password", label: "Create password", type: "password", placeholder: "Create a secure password" },
  { key: "confirmPassword", label: "Confirm password", type: "password", placeholder: "Re-enter password" },
  { key: "username", label: "Custom username", type: "text", placeholder: "Choose a username" },
] as const;

export type OnboardingFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  username: string;
  region: "AU" | "US";
};

const initialState: OnboardingFields = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  username: "",
  region: "AU",
};

const buildSaleEndDate = () => {
  const now = new Date();
  const end = new Date(`${now.getFullYear()}-12-31T23:59:59+11:00`);
  if (now.getTime() > end.getTime()) {
    return new Date(`${now.getFullYear() + 1}-12-31T23:59:59+11:00`);
  }
  return end;
};

const getTimeRemaining = (target: Date) => {
  const total = target.getTime() - Date.now();
  const clamped = Math.max(total, 0);
  return {
    total,
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
  };
};

const OnboardingPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { signup, loading } = useAuth();
  const [form, setForm] = useState<OnboardingFields>(initialState);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFields, string>>>({});
  const saleEndDate = useMemo(buildSaleEndDate, []);
  const [countdown, setCountdown] = useState(() => getTimeRemaining(saleEndDate));
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getTimeRemaining(saleEndDate)), 1000);
    return () => clearInterval(timer);
  }, [saleEndDate]);

  const validateField = (key: keyof OnboardingFields, value: string) => {
    const trimmed = value.trim();
    switch (key) {
      case "firstName":
      case "lastName":
      case "username":
        if (!trimmed) return "This field is required.";
        return undefined;
      case "email":
        if (!trimmed) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email.";
        return undefined;
      case "phone":
        if (!trimmed) return "Phone number is required.";
        return undefined;
      case "password":
        if (trimmed.length < 8) return "Use at least 8 characters.";
        return undefined;
      case "confirmPassword":
        if (trimmed !== form.password) return "Passwords must match.";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (key: keyof OnboardingFields, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleNext = async () => {
    if (step < steps.length) {
      const current = steps[step];
      const err = validateField(current.key, form[current.key]);
      if (err) {
        setErrors((prev) => ({ ...prev, [current.key]: err }));
        return;
      }
      if (current.key === "confirmPassword" && form.password !== form.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords must match." }));
        return;
      }
      setStep((prev) => prev + 1);
      return;
    }

    const err = validateField("username", form.username);
    if (err) {
      setErrors((prev) => ({ ...prev, username: err }));
      return;
    }

    setSubmissionError(null);
    const result = await signup({
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      username: form.username.trim(),
      region: form.region,
    });
    if (result.error) {
      setSubmissionError(result.error);
      return;
    }
    if (result.requiresEmailConfirmation) {
      setRequiresEmailConfirmation(true);
      setConfirmationEmail(form.email.trim());
      return;
    }
    onComplete();
  };

  const renderRegionStep = () => (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-xl space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">Step {steps.length + 1} of {steps.length + 1}</p>
        <div className="space-y-4 text-white">
          <p className="text-lg font-semibold">Select your region</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleChange("region", "AU")}
              className={`interactive-primary flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-white ${
                form.region === "AU" ? "border-primary/70 bg-primary/20" : "border-white/20 bg-white/10"
              }`}
            >
              <span className="text-lg font-semibold">Australia</span>
              <span className="text-sm text-white/70">Available</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-left text-white/40"
              disabled
              aria-disabled
            >
              <span className="text-lg font-semibold">USA</span>
              <span className="text-sm">Coming soon</span>
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-xl items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(steps.length - 1)}
          className="text-sm font-semibold text-white/70 transition hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="interactive-primary rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
        >
          Continue
        </button>
      </div>
      {submissionError && <p className="text-center text-sm text-rose-200">{submissionError}</p>}
    </div>
  );

  const renderFormStep = () => {
    const current = steps[step];
    return (
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-xl space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">Step {step + 1} of {steps.length + 1}</p>
          <div className="space-y-4">
            <label className="space-y-3 text-white">
              <span className="text-lg font-semibold">{current.label}</span>
              <input
                type={current.type}
                value={form[current.key]}
                placeholder={current.placeholder}
                onChange={(event) => handleChange(current.key, event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-2xl font-semibold text-white placeholder:text-white/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
            </label>
            {errors[current.key] && <p className="text-sm text-rose-200">{errors[current.key]}</p>}
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-xl items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              className="text-sm font-semibold text-white/70 transition hover:text-white"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleNext}
            className="interactive-primary rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
            disabled={loading}
          >
            Next
          </button>
        </div>
        {submissionError && <p className="text-center text-sm text-rose-200">{submissionError}</p>}
      </div>
    );
  };

  if (requiresEmailConfirmation) {
    return (
      <div className="px-4 pb-16 pt-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center text-white">
          <h1 className="text-3xl font-black uppercase tracking-[0.22em]">MyAiBank</h1>
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-lg font-semibold">Check your email to confirm your account</p>
            <p className="mt-3 text-white/70">
              {confirmationEmail
                ? `We sent a confirmation link to ${confirmationEmail}. Click the link to continue.`
                : "We sent a confirmation link to your email. Click the link to continue."}
            </p>
            <p className="mt-6 text-sm text-white/60">Once confirmed, you will be redirected to complete your subscription.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-16 pt-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[0.22em]">MyAiBank</h1>
          <p className="text-sm text-white/70">Clean, minimal onboarding for Australian residents.</p>
        </header>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          {countdown.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold text-white">Sale ends Dec 31.</span>
              <div className="flex gap-3 text-center text-white/80">
                <div>
                  <p className="text-lg font-bold leading-tight">{countdown.days}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Days</p>
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{countdown.hours}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Hours</p>
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{countdown.minutes}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Minutes</p>
                </div>
              </div>
            </div>
          ) : (
            <span className="font-semibold text-white">Choose your plan.</span>
          )}
        </div>
        {step >= steps.length ? renderRegionStep() : renderFormStep()}
      </div>
    </div>
  );
};

export default OnboardingPage;
