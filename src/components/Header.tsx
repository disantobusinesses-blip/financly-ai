import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { initiateBankConnection } from "../services/BankingService";
import { Bars3Icon, XMarkIcon, HomeIcon, LightBulbIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  activeView: "dashboard" | "whatWeDo";
  onNavigate: (view: "dashboard" | "whatWeDo") => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onNavigate }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const navigateTo = (view: "dashboard" | "whatWeDo") => {
    onNavigate(view);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMenu}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-primary hover:text-primary"
              aria-label="Open navigation"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
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

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="relative z-10 flex h-full w-72 flex-col justify-between bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Explore
              </p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-primary hover:text-primary"
                aria-label="Close navigation"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-6 space-y-3 text-sm font-semibold text-slate-700">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo("dashboard")}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    activeView === "dashboard"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 bg-white hover:border-primary/60"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <HomeIcon className="h-5 w-5" />
                    Dashboard
                  </span>
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Main hub
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo("whatWeDo")}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    activeView === "whatWeDo"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 bg-white hover:border-primary/60"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <LightBulbIcon className="h-5 w-5" />
                    What we do
                  </span>
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Learn more
                  </span>
                </button>
              </li>
            </ul>

            <div className="space-y-3 text-xs text-slate-500">
              <p className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quick links
              </p>
              <a
                className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                href="#financial-wellness"
                onClick={() => setMenuOpen(false)}
              >
                Jump to Financial Wellness
              </a>
              <a
                className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                href="#subscription-hunter"
                onClick={() => setMenuOpen(false)}
              >
                Review Subscription Hunter
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
