import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { initiateBankConnection } from "../services/BankingService";

interface HeaderProps {
  activeView: "dashboard" | "what-we-do";
  onNavigate: (view: "dashboard" | "what-we-do") => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onNavigate }) => {
  const { user, logout, remainingBasicDays } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isBasic = user?.membershipType === "Basic";
  const basicChip = isBasic
    ? remainingBasicDays === 0
      ? "Basic preview ended"
      : remainingBasicDays
      ? `${remainingBasicDays} days left`
      : "Basic showcase"
    : "Pro member";

  const handleConnectBankClick = async () => {
    if (!user?.email) return;
    try {
      const { consentUrl, userId } = await initiateBankConnection(user.email);
      localStorage.setItem("basiqUserId", userId);
      localStorage.removeItem("demoMode");
      window.location.href = consentUrl;
    } catch (err) {
      console.error("Failed to start bank connection:", err);
      alert("Unable to connect bank right now.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-4 text-white backdrop-blur">
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold uppercase tracking-[0.3em] hover:border-white/50"
          >
            ☰
          </button>
        )}
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-lg font-bold tracking-wide text-white transition hover:bg-white/20"
        >
          <span className="rounded-lg bg-primary px-2 py-1 text-sm font-semibold text-white">FA</span>
          Financly AI
        </button>
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-white/70 sm:inline-flex">
            {basicChip}
          </span>
          <button
            onClick={handleConnectBankClick}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
          >
            Connect bank
          </button>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/50 hover:text-white"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("dashboard")}
            className={`text-sm font-semibold uppercase tracking-[0.3em] ${activeView === "dashboard" ? "text-white" : "text-white/60"}`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate("what-we-do")}
            className={`text-sm font-semibold uppercase tracking-[0.3em] ${activeView === "what-we-do" ? "text-white" : "text-white/60"}`}
          >
            What we do
          </button>
        </div>
      )}

      {menuOpen && user && (
        <div
          className="fixed inset-0 z-40 flex"
          onClick={() => setMenuOpen(false)}
        >
          <div className="h-full w-64 bg-slate-950/95 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Quick links</p>
              <p className="text-lg font-semibold text-white">{user.displayName} {user.avatar}</p>
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                {basicChip}
              </span>
            </div>
            <nav className="space-y-4 text-sm font-semibold text-white/80">
              <button
                onClick={() => {
                  onNavigate("dashboard");
                  setMenuOpen(false);
                }}
                className={`block w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10 ${
                  activeView === "dashboard" ? "bg-white/10 text-white" : ""
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  onNavigate("what-we-do");
                  setMenuOpen(false);
                }}
                className={`block w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10 ${
                  activeView === "what-we-do" ? "bg-white/10 text-white" : ""
                }`}
              >
                What we do
              </button>
            </nav>
            <div className="mt-8 space-y-3 text-xs text-white/60">
              <p>Your email becomes your Basiq user ID for secure bank connections.</p>
              <p>Need support? hello@financly.ai</p>
            </div>
          </div>
          <div className="flex-1 bg-black/40" />
        </div>
      )}
    </header>
  );
};

export default Header;
