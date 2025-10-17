import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { initiateBankConnection } from "../services/BankingService";

const Header: React.FC = () => {
  const { user, logout } = useAuth();

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
      localStorage.removeItem("basiqUserId");
      localStorage.setItem("demoMode", "true");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-500 text-white shadow"
            onClick={() => (window.location.href = "/")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                window.location.href = "/";
              }
            }}
          >
            FA
          </div>
          <div className="space-y-1">
            <button
              className="text-left text-xl font-semibold text-slate-900 hover:text-primary"
              onClick={() => (window.location.href = "/")}
            >
              Financly AI
            </button>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Smarter money, one swipe away
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={handleConnectBankClick}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Connect bank
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => (window.location.href = "/login")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
              >
                Login
              </button>
              <button
                onClick={() => (window.location.href = "/signup")}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Create account
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
