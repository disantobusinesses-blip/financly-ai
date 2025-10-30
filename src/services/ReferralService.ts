import { ReferralRecord } from "../types";

interface RegisterReferralPayload {
  referrerId: string;
  referredEmail: string;
  referredUserId: string;
}

interface ProfilePayload {
  userId: string;
  email: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export const syncReferralProfile = async (payload: ProfilePayload): Promise<void> => {
  try {
    await fetch("/api/referral-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to sync referral profile", error);
  }
};

export const registerReferral = async (payload: RegisterReferralPayload): Promise<void> => {
  try {
    await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Unable to register referral", error);
  }
};

export const fetchReferrals = async (referrerId: string): Promise<ReferralRecord[]> => {
  try {
    const response = await fetch(`/api/referrals?referrerId=${encodeURIComponent(referrerId)}`);
    if (!response.ok) {
      throw new Error("Failed to load referrals");
    }
    const data = await response.json();
    return data.referrals ?? [];
  } catch (error) {
    console.error("Unable to fetch referrals", error);
    return [];
  }
};

