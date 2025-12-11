import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { SupabaseProfile, OnboardingStep } from "../lib/supabaseClient";

interface StepConfig {
  key: OnboardingStep;
  title: string;
  description: string;
}

const steps: StepConfig[] = [
  { key: "BASICS", title: "Tell us where you are", description: "Country and currency help us tailor your experience." },
  { key: "MONEY", title: "Your pay and bank", description: "We will personalise insights around your pay cycle." },
  {
    key: "CONNECT_BANK",
    title: "Connect your bank",
    description: "Securely link your accounts so we can keep your insights up to date.",
  },
];

type BasicsForm = { country: string; currency: string };
type MoneyForm = { pay_cycle: string; primary_bank: string };

const OnboardingPage: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [basics, setBasics] = useState<BasicsForm>({ country: "Australia", currency: "AUD" });
  const [money, setMoney] = useState<MoneyForm>({ pay_cycle: "Monthly", primary_bank: "" });
  const [saving, setSaving] = useState(false);
  const [connectingBank, setConnectingBank] = useState(false);

  const activeStep = useMemo<OnboardingStep>(() => profile?.onboarding_step ?? "BASICS", [profile?.onboarding_step]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profileError) setError(profileError.message);

      const loaded = profileData as SupabaseProfile | null;
      if (!loaded) {
        setError("Profile not found. Please sign up again.");
        setLoading(false);
        return;
      }

      setProfile(loaded);

      if (loaded.country) setBasics((prev) => ({ ...prev, country: loaded.country }));
      if (loaded.currency) setBasics((prev) => ({ ...prev, currency: loaded.currency }));
      if (loaded.pay_cycle) setMoney((prev) => ({ ...prev, pay_cycle: loaded.pay_cycle }));
      if (loaded.primary_bank) setMoney((prev) => ({ ...prev, primary_bank: loaded.primary_bank }));

      if (loaded.is_onboarded) {
        window.location.replace("/app/dashboard");
        return;
      }

      setLoading(false);
    };

    void load();
  }, []);

  const handleBasicsSubmit = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        country: basics.country,
        currency: basics.currency,
        onboarding_step: "MONEY",
      })
      .eq("id", profile.id);

    if (error) setError(error.message);
    else
      setProfile((prev) =>
        prev ? { ...prev, country: basics.country, currency: basics.currency, onboarding_step: "MONEY" } : prev
      );

    setSaving(false);
  };

  const handleMoneySubmit = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        pay_cycle: money.pay_cycle,
        primary_bank: money.primary_bank,
        onboarding_step: "CONNECT_BANK",
      })
      .eq("id", profile.id);

    if (error) setError(error.message);
    else
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              pay_cycle: money.pay_cycle,
              primary_bank: money.primary_bank,
              onboarding_step: "CONNECT_BANK",
            }
          : prev
      );

    setSaving(false);
  };

  useEffect(() => {
    if (activeStep === "CONNECT_BANK" && profile?.has_bank_connection) {
      const complete = async () => {
        if (!profile) return;
        setSaving(true);

        const { error } = await supabase
          .from("profiles")
          .update({ onboarding_step: "COMPLETE", is_onboarded: true })
          .eq("id", profile.id);

        setSaving(false);

        if (!error) {
          window.location.replace("/app/dashboard");
          onComplete?.();
        }
      };

      void complete();
    }
  }, [activeStep, profile, onComplete]);

  const handleConnectBank = async () => {
    if (!profile) return;

    setConnectingBank(true);
    setError(null);

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      setConnectingBank(false);
      setError(sessionErr?.message || "Please log in again.");
      return;
    }

    try {
      const res = await fetch("/api/create-consent-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ email: sessionData.session.user.email }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Unable to start bank connection");
      }

      const data = await res.json();

      // Save Fiskil user ID
      if (data.userId) {
        await supabase
          .from("profiles")
          .update({ fiskil_user_id: data.userId })
          .eq("id", profile.id);

        setProfile((prev) =>
          prev ? { ...prev, fiskil_user_id: data.userId } : prev
        );
      }

      if (data.consentUrl) {
        window.location.href = data.consentUrl;
      }
    } catch (err: any) {
      setError(err?.message || "Unable to connect bank.");
    } finally {
      setConnectingBank(false);
    }
  };

  const renderBasics = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="space-y-2 text-white">
          <span className="text-sm text-white/80">Country</span>
          <input
            value={basics.country}
            onChange={(e) => setBasics((prev) => ({ ...prev, country: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-white/60"
          />
        </label>
        <label className="space-y-2 text-white">
          <span className="text-sm text-white/80">Currency</span>
          <input
            value={basics.currency}
            onChange={(e) => setBasics((prev) => ({ ...prev, currency: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-white/60"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={handleBasicsSubmit}
        className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
        disabled={saving}
      >
        Save and continue
      </button>
    </div>
  );

  const renderMoney = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="space-y-2 text-white">
          <span className="text-sm text-white/80">Pay cycle</span>
          <input
            value={money.pay_cycle}
            onChange={(e) => setMoney((prev) => ({ ...prev, pay_cycle: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-white/60"
          />
        </label>
        <label className="space-y-2 text-white">
          <span className="text-sm text-white/80">Primary bank</span>
          <input
            value={money.primary_bank}
            onChange={(e) => setMoney((prev) => ({ ...prev, primary_bank: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-white/60"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={handleMoneySubmit}
        className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white"
        disabled={saving}
      >
        Finish
      </button>
    </div>
  );

  const renderConnectBank = () => (
    <div className="space-y-6">
      {profile?.has_bank_connection ? (
        <p className="text-white/70">Bank connected. Finalising your setup...</p>
      ) : (
        <>
          <p className="text-white/70">Connect your bank to continue to your dashboard.</p>
          <button
            type="button"
            onClick={handleConnectBank}
            className="interactive-primary w-full rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white disabled:opacity-60"
            disabled={saving || connectingBank}
          >
            {connectingBank ? "Starting connection..." : "Connect your bank"}
          </button>
        </>
      )}
    </div>
  );

  const activeContent =
    activeStep === "BASICS"
      ? renderBasics()
      : activeStep === "MONEY"
      ? renderMoney()
      : renderConnectBank();

  if (loading) return <div className="px-4 py-24 text-center text-white">Loading onboarding...</div>;

  if (error) {
    return (
      <div className="px-4 py-24 text-center text-white">
        <p className="text-lg font-semibold">We hit a snag loading onboarding.</p>
        <p className="mt-2 text-white/70">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-16 pt-24 text-white">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">
          Step {activeIndex} of {steps.length}
        </p>
        <h1 className="text-3xl font-black uppercase tracking-[0.22em]">MyAiBank</h1>
        <div className="space-y-2">
          <p className="text-xl font-semibold">{activeDefinition?.title}</p>
          <p className="text-white/70">{activeDefinition?.description}</p>
        </div>
        {activeContent}
      </div>
    </div>
  );
};

export default OnboardingPage;
