import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LegalModal from "../components/LegalModal";
import { PRIVACY_CONTENT, TERMS_CONTENT } from "../legal/legalContent";

type Step = 1 | 2 | 3;

const formatDobForInput = (value: string) => value;

const isValidDob = (value: string) => {
  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

const pushRoute = (path: string) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const SignupPage: React.FC = () => {
  const [step, setStep] = useState<Step>(1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [dob, setDob] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [legalModal, setLegalModal] = useState<null | "privacy" | "terms">(null);

  const canContinueStep1 = useMemo(() => {
    return fullName.trim().length >= 2 && email.trim().length >= 5 && password.length >= 8;
  }, [fullName, email, password]);

  const canContinueStep2 = useMemo(() => isValidDob(dob), [dob]);

  const canSubmit = useMemo(() => {
    return canContinueStep1 && canContinueStep2 && acceptPrivacy && acceptTerms;
  }, [canContinueStep1, canContinueStep2, acceptPrivacy, acceptTerms]);

  const goToLogin = () => pushRoute("/login");

  const goNext = () => {
    setError(null);
    if (step === 1 && canContinueStep1) setStep(2);
    if (step === 2 && canContinueStep2) setStep(3);
  };

  const goBack = () => {
    setError(null);
    if (step === 3) setStep(2);
    if (step === 2) setStep(1);
  };

  const handleCreateAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setError("Please complete all fields and accept Terms and Privacy.");
      return;
    }

    setSubmitting(true);
    try {
      // IMPORTANT: Keep signup stable. We store extra info in user metadata (no DB schema changes required).
      const emailTrimmed = email.trim();
      const fullNameTrimmed = fullName.trim();

      const { data, error: signupError } = await supabase.auth.signUp({
        email: emailTrimmed,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullNameTrimmed,
            dob,
            accepted_terms_at: new Date().toISOString(),
            accepted_privacy_at: new Date().toISOString(),
          },
        },
      });

      if (signupError) throw signupError;

      if (data?.session) {
        setSuccessMessage("Account created. You are signed in.");
        pushRoute("/onboarding");
        return;
      }

      setSuccessMessage("Account created. Please check your email to confirm your account, then log in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create your account right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const StepPill: React.FC<{ current: boolean; label: string; sub: string }> = ({ current, label, sub }) => (
    <div
      className={[
        "flex-1 rounded-2xl border px-4 py-3 transition-all duration-300",
        current ? "border-white/20 bg-white/10" : "border-white/10 bg-[#0b0b10] opacity-70",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{sub}</p>
    </div>
  );

  const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">{children}</label>
  );

  const InputBase =
    "w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-black/60";

  const CheckboxRow: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: React.ReactNode;
  }> = ({ checked, onChange, children }) => {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20">
        <span className="relative mt-0.5 inline-flex h-5 w-5 items-center justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span
            className={[
              "h-5 w-5 rounded-md border transition",
              "border-white/20 bg-black/50",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-white/30",
              "peer-checked:border-[#1F0051]/70 peer-checked:bg-[#1F0051]",
            ].join(" ")}
            aria-hidden="true"
          />
          <svg
            className="pointer-events-none absolute h-4 w-4 text-white opacity-0 transition peer-checked:opacity-100"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.25a1 1 0 0 1-1.422.003L3.29 9.21a1 1 0 1 1 1.42-1.405l3.07 3.1 6.49-6.536a1 1 0 0 1 1.414-.078z"
              clipRule="evenodd"
            />
          </svg>
        </span>

        <span className="text-sm text-white/80">{children}</span>
      </label>
    );
  };

  return (
    <>
      <div className="relative min-h-[100dvh] px-4 pb-16 pt-24 text-white">
        {/* Background (opaque, figma-style) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[#05050a]" />
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#1F0051]/25 blur-3xl" />
          <div className="absolute -right-44 -bottom-40 h-[520px] w-[520px] rounded-full bg-white/[0.04] blur-3xl" />
        </div>

        <form onSubmit={handleCreateAccount} className="relative mx-auto w-full max-w-lg">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/60">
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Get started</p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">Create your MyAiBank account</h1>
                  <p className="mt-2 text-sm text-white/65">Clean onboarding, privacy-first, built for finance-only insights.</p>
                </div>

                <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="text-xs font-semibold text-white/70">Secure signup</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <StepPill current={step === 1} label="Page 1" sub="Basics" />
                <StepPill current={step === 2} label="Page 2" sub="DOB" />
                <StepPill current={step === 3} label="Page 3" sub="Agreements" />
              </div>

              <div className="mt-6 space-y-5">
                {/* STEP 1 */}
                <div
                  className={[
                    "transition-all duration-300",
                    step === 1
                      ? "opacity-100 translate-y-0"
                      : "pointer-events-none opacity-0 -translate-y-2 h-0 overflow-hidden",
                  ].join(" ")}
                >
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <FieldLabel>Full name</FieldLabel>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={InputBase}
                        placeholder="Your name"
                        autoComplete="name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <FieldLabel>Email</FieldLabel>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={InputBase}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <FieldLabel>Password</FieldLabel>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={InputBase}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                        required
                      />
                      <p className="text-xs text-white/45">Use at least 8 characters.</p>
                    </div>
                  </div>
                </div>

                {/* STEP 2 */}
                <div
                  className={[
                    "transition-all duration-300",
                    step === 2
                      ? "opacity-100 translate-y-0"
                      : "pointer-events-none opacity-0 -translate-y-2 h-0 overflow-hidden",
                  ].join(" ")}
                >
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-white">Date of birth</p>
                    <p className="text-sm text-white/65">
                      Used to personalise budgeting insights and keep your account secure.
                    </p>

                    <div className="space-y-2">
                      <FieldLabel>DOB</FieldLabel>
                      <input
                        type="date"
                        value={formatDobForInput(dob)}
                        onChange={(e) => setDob(e.target.value)}
                        className={InputBase}
                        required
                      />
                      {!canContinueStep2 && dob.length > 0 && (
                        <p className="text-xs text-rose-200">Please enter a valid date.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* STEP 3 */}
                <div
                  className={[
                    "transition-all duration-300",
                    step === 3
                      ? "opacity-100 translate-y-0"
                      : "pointer-events-none opacity-0 -translate-y-2 h-0 overflow-hidden",
                  ].join(" ")}
                >
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-white">Terms & privacy</p>
                    <p className="text-sm text-white/65">Tick both boxes to continue.</p>

                    <div className="space-y-3">
                      <CheckboxRow checked={acceptPrivacy} onChange={setAcceptPrivacy}>
                        I have read the{" "}
                        <button
                          type="button"
                          className="font-semibold text-white underline underline-offset-4 hover:text-white/90"
                          onClick={() => setLegalModal("privacy")}
                        >
                          Privacy Policy
                        </button>
                        .
                      </CheckboxRow>

                      <CheckboxRow checked={acceptTerms} onChange={setAcceptTerms}>
                        I agree to the{" "}
                        <button
                          type="button"
                          className="font-semibold text-white underline underline-offset-4 hover:text-white/90"
                          onClick={() => setLegalModal("terms")}
                        >
                          Terms of Use
                        </button>
                        .
                      </CheckboxRow>
                    </div>

                    {!acceptPrivacy || !acceptTerms ? (
                      <p className="text-xs text-white/45">Both checkboxes are required.</p>
                    ) : null}
                  </div>
                </div>

                {error && (
                  <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </p>
                )}

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    <p>{successMessage}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={goToLogin}
                        className="interactive-primary rounded-xl bg-[#1F0051] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Go to login
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open("mailto:info@myaibank.ai")}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                      >
                        Contact support
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className={[
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      step === 1
                        ? "pointer-events-none opacity-0"
                        : "border-white/10 bg-black/40 text-white/80 hover:border-white/25 hover:bg-black/55",
                    ].join(" ")}
                  >
                    Back
                  </button>

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2)}
                      className="interactive-primary ml-auto rounded-2xl bg-[#1F0051] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting || !canSubmit}
                      className="interactive-primary ml-auto rounded-2xl bg-[#1F0051] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Creating…" : "Create account"}
                    </button>
                  )}
                </div>

                <div className="pt-4 text-center">
                  <p className="text-xs text-white/55">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={goToLogin}
                      className="font-semibold text-white underline underline-offset-4 hover:text-white/90"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <LegalModal
        title={legalModal === "privacy" ? "Privacy Policy" : "Terms and Conditions"}
        body={legalModal === "privacy" ? PRIVACY_CONTENT : TERMS_CONTENT}
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
      />
    </>
  );
};

export default SignupPage;
