import React from "react";
import { useAuth } from "../contexts/AuthContext";

const ProfilePage: React.FC = () => {
  const { user, profile } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-12 text-white/70">
        <p>Please log in to view your profile.</p>
        <a
          href="/login"
          className="inline-flex w-fit rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
        >
          Go to login
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Profile</p>
          <h1 className="text-2xl font-semibold text-white">My profile</h1>
        </div>
        <a
          href="/app/dashboard"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
        >
          Back to dashboard
        </a>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 text-white/80">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Name</p>
            <p className="text-lg text-white">{user.displayName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Email</p>
            <p className="text-lg text-white">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Plan</p>
            <p className="text-lg text-white">{user.membershipType}</p>
          </div>
          {profile?.country && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Region</p>
              <p className="text-lg text-white">{profile.country}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
