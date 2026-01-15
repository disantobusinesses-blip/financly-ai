import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  activeView: "dashboard" | "what-we-do" | "sandbox";
  onNavigate: (view: "dashboard" | "what-we-do" | "sandbox") => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onNavigate }) => {
  const { user, logout, remainingBasicDays } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const statusChip = (() => {
    if (!user) return "";
    if (user.membershipType === "Basic") {
      if (remainingBasicDays === 0) return "Basic preview ended";
      if (remainingBasicDays) return `${remainingBasicDays} days left`;
      return "Basic showcase";
    }
    if (user.proTrialEnds) {
      const diff = Math.ceil(
        (new Date(user.proTrialEnds).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
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

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-4 text-white backdrop-blur">
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-base font-semibold text-white/80 transition hover:border-white/50 hover:text-white"
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

      {user ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-white/70 sm:inline-flex">
            {statusChip}
          </span>
        </div>
      ) : (
        <div className="flex w-full flex-col items-stretch gap-2 text-right sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            onClick={() => onNavigate("dashboard")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] sm:px-0 sm:py-0 sm:text-right ${
              activeView === "dashboard" ? "text-white" : "text-white/60"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate("what-we-do")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] sm:px-0 sm:py-0 sm:text-right ${
              activeView === "what-we-do" ? "text-white" : "text-white/60"
            }`}
          >
            What we do
          </button>
          <button
            onClick={() => onNavigate("sandbox")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] sm:px-0 sm:py-0 sm:text-right ${
              activeView === "sandbox" ? "text-white" : "text-white/60"
            }`}
          >
            Sandbox
          </button>
        </div>
      )}

      {menuOpen && user && (
        <div className="fixed inset-0 z-40 flex items-start justify-end px-4 py-4">
          <div
            ref={menuRef}
            className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-[#0b0b10] shadow-lg"
          >
            <div className="mb-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Quick links
              </p>
              <p className="text-lg font-semibold text-[#0b0b10]">
                {user.displayName} {user.avatar}
              </p>
              <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
                {statusChip}
              </span>
            </div>

            <nav className="overflow-hidden rounded-xl border border-slate-200 text-sm font-semibold">
              <a
                href="/connect-bank"
                onClick={() => {
                  setMenuOpen(false);
                }}
                className="block w-full border-b border-slate-200 px-4 py-3 text-left text-[#0b0b10] transition hover:bg-slate-50"
              >
                Connect bank
              </a>
              <a
                href="/dashboard"
                onClick={() => {
                  setMenuOpen(false);
                }}
                className="block w-full border-b border-slate-200 px-4 py-3 text-left text-[#0b0b10] transition hover:bg-slate-50"
              >
                My dashboard
              </a>
              <a
                href="/profile"
                onClick={() => {
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-[#0b0b10] transition hover:bg-slate-50"
              >
                Profile
              </a>
            </nav>

            <button
              onClick={handleLogout}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0b0b10] transition hover:border-slate-300"
            >
              Logout
            </button>

            <div className="mt-4 space-y-3 text-xs text-slate-500">
              <p>Need support? hello@myaibank.ai</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
