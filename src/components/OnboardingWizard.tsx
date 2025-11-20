import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNewsletterSignup } from "../hooks/useNewsletterSignup";
import { createUserAccount } from "../services/createUserAccount";
import { fetchGeoCountry } from "../services/geoClient";
import { fetchSubscriptionPlans, SubscriptionPlan } from "../services/subscriptionPlans";

const FORM_STEPS = [
  { key: "firstName", label: "First name", type: "text", placeholder: "Enter your first name" },
  { key: "lastName", label: "Surname", type: "text", placeholder: "Enter your surname" },
  { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone number", type: "tel", placeholder: "+61 400 000 000" },
  { key: "password", label: "Create password", type: "password", placeholder: "Create a secure password" },
  { key: "confirmPassword", label: "Confirm password", type: "password", placeholder: "Re-enter password" },
  { key: "username", label: "Custom username", type: "text", placeholder: "Choose a username" },
] as const;

type StepKey = (typeof FORM_STEPS)[number]["key"];

type FormState = Record<StepKey, string>;

type SubmissionState = "idle" | "submitting" | "success" | "error";

const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  username: "",
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const buildSaleEndDate = () => {
  const now = new Date();
  const currentYearEnd = new Date(`${now.getFullYear()}-12-31T23:59:59+11:00`);
  if (now.getTime() > currentYearEnd.getTime()) {
    return new Date(`${now.getFullYear() + 1}-12-31T23:59:59+11:00`);
  }
  return currentYearEnd;
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

const OnboardingWizard: React.FC = () => {
  const { isSignupModalOpen, setIsSignupModalOpen } = useAuth();
  const { email, setEmail, status: newsletterStatus, submit: submitNewsletter, reset: resetNewsletter } =
    useNewsletterSignup();
  const [country, setCountry] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">("idle");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<StepKey, string>>>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const saleEndDate = useMemo(buildSaleEndDate, []);
  const [countdown, setCountdown] = useState(() => getTimeRemaining(saleEndDate));

  const resetWizard = () => {
    setCurrentStep(0);
    setFormState(initialFormState);
    setFieldErrors({});
    setSubmissionState("idle");
    setSubmissionError(null);
    setSelectedPlanId(null);
    setPlanError(null);
    setCountry(null);
    setGeoStatus("idle");
    resetNewsletter();
  };

  useEffect(() => {
    if (!isSignupModalOpen) return;

    setGeoStatus("loading");
    fetchGeoCountry()
      .then((response) => setCountry(response.country?.toUpperCase?.() || "UNKNOWN"))
      .catch(() => {
        setGeoStatus("error");
        setCountry("UNKNOWN");
      })
      .finally(() => setGeoStatus("idle"));

    fetchSubscriptionPlans().then((loadedPlans) => setPlans(loadedPlans));
  }, [isSignupModalOpen]);

  useEffect(() => {
    if (!isSignupModalOpen) return;
    const timer = setInterval(() => setCountdown(getTimeRemaining(saleEndDate)), 1000);
    return () => clearInterval(timer);
  }, [saleEndDate, isSignupModalOpen]);

  const allowedRegion = country === "AU";
  const showPlanSelection = currentStep >= FORM_STEPS.length;

  const monthlyPlan = plans.find((plan) => plan.interval === "month") || plans[0];
  const annualPlan = plans.find((plan) => plan.interval === "year") || plans[1] || monthlyPlan;

  const savingsPercent = useMemo(() => {
    if (!monthlyPlan || !annualPlan || monthlyPlan.price <= 0) return 0;
    const savings = (12 * monthlyPlan.price - annualPlan.price) / (12 * monthlyPlan.price);
    return Math.max(0, Math.round(savings * 100));
  }, [annualPlan, monthlyPlan]);

  const validateField = (key: StepKey, value: string): string | undefined => {
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
        if (trimmed.replace(/[^0-9+]/g, "").length < 8) return "Enter a valid phone number.";
        return undefined;
      case "password":
        if (!trimmed) return "Password is required.";
        if (trimmed.length < 8) return "Use at least 8 characters.";
        return undefined;
      case "confirmPassword":
        if (trimmed !== formState.password.trim()) return "Passwords must match.";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (key: StepKey, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleNext = () => {
    const step = FORM_STEPS[currentStep];
    const error = validateField(step.key, formState[step.key]);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [step.key]: error }));
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (showPlanSelection) {
      setCurrentStep(FORM_STEPS.length - 1);
      return;
    }
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      setPlanError("Select a plan to continue.");
      return;
    }

    const stepErrors: Partial<Record<StepKey, string>> = {};
    FORM_STEPS.forEach(({ key }) => {
      const error = validateField(key, formState[key]);
      if (error) stepErrors[key] = error;
    });

    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors(stepErrors);
      setCurrentStep(0);
      return;
    }

    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || monthlyPlan;

    setSubmissionState("submitting");
    setSubmissionError(null);
    try {
      await createUserAccount({
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        username: formState.username.trim(),
        password: formState.password,
        selectedPlan: selectedPlan?.name || "Monthly",
      });
      setSubmissionState("success");
    } catch (error) {
      console.error("Account creation failed", error);
      setSubmissionError("Unable to create your account right now. Please try again.");
      setSubmissionState("error");
    }
  };

  const handleClose = () => {
    resetWizard();
    setIsSignupModalOpen(false);
  };

  const renderRegionSelector = () => (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
      <span className="text-white/70">Region</span>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl border border-primary/50 bg-primary/20 px-3 py-2 text-sm font-semibold text-white"
        >
          Australia
        </button>
        <button
          type="button"
          className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-white/40"
          disabled
          aria-disabled
        >
          USA – Coming soon!
        </button>
      </div>
      {country && (
        <span className={`ml-auto text-xs font-semibold ${allowedRegion ? "text-emerald-200" : "text-amber-200"}`}>
          Detected: {country}
        </span>
      )}
    </div>
  );

  if (!isSignupModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 text-white shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-white/60 transition hover:text-white"
          aria-label="Close onboarding"
        >
          ×
        </button>

        <div className="grid gap-6 p-8 sm:p-10">
          <header className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-light">Welcome</span>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-2xl font-black uppercase tracking-[0.22em] sm:text-3xl">MyAiBank</span>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Onboarding
              </span>
            </div>
            <p className="text-sm text-white/70">Premium, minimal, and tailored for Australian residents.</p>
          </header>

          {renderRegionSelector()}

          {geoStatus === "loading" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
              Checking your location so we can tailor the experience...
            </div>
          )}

          {country && !allowedRegion ? (
            <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-semibold">We don’t provide service in your country yet.</h3>
                <p className="text-sm text-white/70">Join the newsletter to find out when we expand.</p>
              </div>
              <form onSubmit={(event) => { event.preventDefault(); void submitNewsletter(); }} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-lg text-white placeholder:text-white/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="submit"
                  className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-primary/40"
                  disabled={newsletterStatus === "loading"}
                >
                  {newsletterStatus === "loading"
                    ? "Adding you..."
                    : newsletterStatus === "success"
                    ? "Added"
                    : "Notify me"}
                </button>
                {newsletterStatus === "error" && (
                  <p className="text-center text-sm text-rose-200">Unable to add you right now. Please try again.</p>
                )}
              </form>
            </div>
          ) : null}

          {allowedRegion && submissionState === "success" && (
            <div className="space-y-4 rounded-3xl border border-emerald-300/30 bg-emerald-500/10 p-6">
              <h3 className="text-2xl font-semibold text-emerald-100">You’re all set.</h3>
              <p className="text-white/80">
                Thanks for choosing MyAiBank. We’ll finalise your account details and send the next steps to {formState.email ||
                  "your inbox"}.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
              >
                Close
              </button>
            </div>
          )}

          {allowedRegion && submissionState !== "success" && country && (
            <div className="space-y-8">
              {!showPlanSelection && (
                <div className="space-y-6">
                  <div className="mx-auto w-full max-w-xl space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/60">Step {currentStep + 1} of {FORM_STEPS.length}</p>
                    <div className="space-y-4">
                      <label className="space-y-3 text-white">
                        <span className="text-lg font-semibold">{FORM_STEPS[currentStep].label}</span>
                        <input
                          type={FORM_STEPS[currentStep].type}
                          value={formState[FORM_STEPS[currentStep].key]}
                          placeholder={FORM_STEPS[currentStep].placeholder}
                          onChange={(event) => handleFieldChange(FORM_STEPS[currentStep].key, event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-2xl font-semibold text-white placeholder:text-white/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                          autoFocus
                        />
                      </label>
                      {fieldErrors[FORM_STEPS[currentStep].key] && (
                        <p className="text-sm text-rose-200">{fieldErrors[FORM_STEPS[currentStep].key]}</p>
                      )}
                    </div>
                  </div>

                  <div className="mx-auto flex w-full max-w-xl items-center justify-between">
                    {currentStep > 0 ? (
                      <button
                        type="button"
                        onClick={handleBack}
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
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {showPlanSelection && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    {countdown.total > 0 ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-semibold text-white">Launch sale ends December 31.</span>
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

                  <div className="grid gap-4 md:grid-cols-2">
                    {[monthlyPlan, annualPlan]
                      .filter(Boolean)
                      .map((plan) => {
                        if (!plan) return null;
                        const isAnnual = plan.interval === "year";
                        const isSelected = plan.id === selectedPlanId;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => {
                              setSelectedPlanId(plan.id);
                              setPlanError(null);
                            }}
                            className={`interactive-primary relative flex h-full flex-col items-start gap-3 rounded-2xl border px-5 py-5 text-left transition ${
                              isSelected
                                ? "border-primary bg-primary/15 shadow-lg shadow-primary/20"
                                : "border-white/10 bg-white/5 hover:border-primary/40"
                            } ${isAnnual ? "md:scale-[1.02]" : ""}`}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div>
                                <p className="text-sm uppercase tracking-[0.2em] text-white/60">{isAnnual ? "Annual plan" : "Monthly plan"}</p>
                                <p className="text-2xl font-bold text-white">{plan.name}</p>
                              </div>
                              {isAnnual ? (
                                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-light">
                                  Best value
                                </span>
                              ) : null}
                            </div>
                            <p className="text-3xl font-bold text-white">
                              {formatCurrency(plan.price, plan.currency)}
                              <span className="ml-1 text-sm font-semibold text-white/60">/{plan.interval === "month" ? "mo" : "yr"}</span>
                            </p>
                            {isAnnual && savingsPercent > 0 && (
                              <p className="text-sm font-semibold text-emerald-200">Save {savingsPercent}% annually</p>
                            )}
                            <p className="text-sm text-white/60">
                              {isAnnual
                                ? "Ideal if you want the best yearly rate and concierge upgrades."
                                : "Flexible month-to-month access with no long-term lock in."}
                            </p>
                            {isSelected && <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary" />}
                          </button>
                        );
                      })}
                  </div>

                  {planError && <p className="text-sm text-rose-200">{planError}</p>}
                  {submissionError && <p className="text-sm text-rose-200">{submissionError}</p>}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-sm font-semibold text-white/70 transition hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="interactive-primary rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-primary/40"
                      disabled={submissionState === "submitting"}
                    >
                      {submissionState === "submitting" ? "Creating account..." : "Confirm and continue"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
