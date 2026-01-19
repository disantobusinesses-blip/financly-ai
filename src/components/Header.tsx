import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  activeView: "dashboard" | "what-we-do" | "sandbox";
  onNavigate: (view: "dashboard" | "what-we-do" | "sandbox") => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onNavigate }) => {
  const { user, logout, remainingBasicDays } = useAuth();

  const [appMenuOpen, setAppMenuOpen] = useState(false); // user logged-in drawer
  const [publicMenuOpen, setPublicMenuOpen] = useState(false); // logged-out mobile menu

  const statusChip = (() => {
    if (!user) return "";
    if (user.membershipType === "Basic") {
      if (remainingBasicDays === 0) return "Basic preview ended";
      if (remainingBasicDays) return `${remainingBasicDays} days left`;
      return "Basic showcase";
    }
    if (user.proTrialEnds) {
      const diff = Math.ceil((new Date(user.proTrialEnds).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diff > 0) return `Pro trial: ${diff} day${diff === 1 ? "" : "s"} left`;
      return "Pro trial completed";
    }
    return "Pro member";
  })();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const NavButton = ({
    label,
    view,
  }: {
    label: string;
    view: "dashboard" | "what-we-do" | "sandbox";
  }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setPublicMenuOpen(false);
      }}
      className={[
        "rounded-xl px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition",
        activeView === view ? "text-white" : "text-white/60 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#050507] px-4 py-4 text-white">
      {/* Left: Brand + (optional) app menu button */}
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={() => setAppMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-base font-semibold text-white/80 transition hover:border-white/50 hover:text-white"
            aria-label="Open menu"
          >
            ☰
          </button>
        )}

        {!user && (
          <button
            onClick={() => setPublicMenuOpen((prev) => !prev)}
            className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-base font-semibold text-white/80 transition hover:border-white/50 hover:text-white"
            aria-label="Open menu"
          >
            ☰
          </button>
        )}

        <button
          onClick={() => onNavigate("dashboard")}
          className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-lg font-semibold tracking-[0.2em] text-white transition hover:border-white/30 hover:bg-white/10"
        >
          <span className="text-base uppercase">MyAiBank</span>
        </button>
      </div>

      {/* Right: user status or public nav */}
      {user ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-white/70 sm:inline-flex">
            {statusChip}
          </span>
        </div>
      ) : (
        <>
          {/* Desktop public nav */}
          <div className="hidden sm:flex items-center justify-end gap-6">
            <NavButton label="Home" view="dashboard" />
            <NavButton label="What we do" view="what-we-do" />
            <NavButton label="Sandbox" view="sandbox" />
          </div>

          {/* Mobile public dropdown */}
          {publicMenuOpen && (
            <div className="sm:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/50" onClick={() => setPublicMenuOpen(false)} />
              <div className="absolute right-4 top-16 w-[240px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/60">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">Menu</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      onNavigate("dashboard");
                      setPublicMenuOpen(false);
                    }}
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/80 hover:bg-white/10"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("what-we-do");
                      setPublicMenuOpen(false);
                    }}
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/80 hover:bg-white/10"
                  >
                    What we do
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("sandbox");
                      setPublicMenuOpen(false);
                    }}
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/80 hover:bg-white/10"
                  >
                    Sandbox
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Logged-in app drawer (existing behaviour, kept) */}
      {user && (
        <div className={`fixed inset-0 z-40 transition ${appMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity ${appMenuOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setAppMenuOpen(false)}
          />
          <div
            className={`absolute left-0 top-0 h-full w-full transform bg-black text-white shadow-2xl transition-transform duration-300 ${
              appMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col px-5 py-6">
              <div className="mb-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Quick links</p>
                <p className="text-lg font-semibold text-white">
                  {user.displayName} {user.avatar}
                </p>
                <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                  {statusChip}
                </span>
              </div>

              <nav className="overflow-hidden rounded-2xl border border-white/10 text-sm font-semibold">
                <a
                  href="/connect-bank"
                  onClick={() => setAppMenuOpen(false)}
                  className="block w-full border-b border-white/10 px-4 py-4 text-left text-white transition hover:bg-white/10"
                >
                  Connect bank
                </a>
                <a
                  href="/dashboard"
                  onClick={() => setAppMenuOpen(false)}
                  className="block w-full border-b border-white/10 px-4 py-4 text-left text-white transition hover:bg-white/10"
                >
                  My dashboard
                </a>
                <a
                  href="/profile"
                  onClick={() => setAppMenuOpen(false)}
                  className="block w-full px-4 py-4 text-left text-white transition hover:bg-white/10"
                >
                  Profile
                </a>
              </nav>

              <button
                onClick={handleLogout}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Logout
              </button>

              <div className="mt-auto pt-6 text-xs text-white/60">
                <p>Need support? hello@myaibank.ai</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;