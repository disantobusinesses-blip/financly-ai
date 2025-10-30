import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { fetchReferrals } from "../services/ReferralService";
import { ReferralRecord } from "../types";

const statusLabels: Record<ReferralRecord["status"], string> = {
  pending: "Waiting for upgrade",
  converted: "Upgrade in progress",
  rewarded: "Reward applied",
};

const ReferAFriendCard: React.FC = () => {
  const { user } = useAuth();
  const [shareUrl, setShareUrl] = useState("");
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}?ref=${encodeURIComponent(user.id)}`);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!user) return () => {
      isMounted = false;
    };

    setLoading(true);
    fetchReferrals(user.id)
      .then((records) => {
        if (!isMounted) return;
        setReferrals(records);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load referral status right now.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) {
    return null;
  }

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch (copyError) {
      console.error("Unable to copy referral link", copyError);
      setError("Copy failed. Try selecting the link manually.");
    }
  };

  const stats = useMemo(() => {
    return referrals.reduce(
      (acc, record) => {
        acc.total += 1;
        acc[record.status] += 1;
        return acc;
      },
      { total: 0, pending: 0, converted: 0, rewarded: 0 }
    );
  }, [referrals]);

  return (
    <section
      className="rounded-3xl bg-gradient-to-br from-white to-slate-100 p-6 shadow-xl ring-1 ring-slate-200/60 dark:from-slate-900 dark:to-slate-950 dark:ring-white/10"
      data-tour-id="refer-a-friend"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Refer a friend</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Share MyAiBank, earn 50% off</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          When a friend upgrades after using your link, you’ll receive three months of Pro at 50% off automatically on your
          subscription.
        </p>
      </header>

      <div className="mt-5 space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-4 shadow-inner dark:bg-slate-900/80">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Your referral link
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={shareUrl}
              readOnly
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We’ll track every signup via this link. Rewards apply once their paid trial converts to a subscription.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {stats.total === 0 ? "Invite your first friend" : `${stats.rewarded} rewards, ${stats.pending} pending`}
              </p>
            </div>
            <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-300">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                Rewarded {stats.rewarded}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                Pending {stats.pending}
              </span>
              <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-700 dark:text-white">
                Total {stats.total}
              </span>
            </div>
          </div>

          <ul className="mt-4 space-y-3 text-sm">
            {loading && <li className="text-slate-500 dark:text-slate-400">Checking referrals...</li>}
            {error && <li className="rounded-xl bg-red-50 px-3 py-2 text-red-600 dark:bg-red-500/10 dark:text-red-200">{error}</li>}
            {!loading && referrals.length === 0 && !error && (
              <li className="rounded-xl bg-slate-100 px-3 py-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                No referrals yet. Share your link and we’ll update this list as soon as someone joins.
              </li>
            )}
            {referrals.map((record) => (
              <li
                key={record.id}
                className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-3 shadow-sm dark:bg-slate-800/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 dark:text-white">{record.referredEmail}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {statusLabels[record.status]}
                  </span>
                </div>
                {record.status === "rewarded" && record.rewardCouponId && (
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    50% off coupon applied (ID: {record.rewardCouponId}). Enjoy the savings!
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ReferAFriendCard;
