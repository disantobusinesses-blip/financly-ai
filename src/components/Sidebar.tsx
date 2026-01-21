import React, { useMemo, useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChartBarIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
  PresentationChartLineIcon,
  ArrowUpRightIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

export type SidebarItem =
  | "overview"
  | "forecast"
  | "subscriptions"
  | "transactions"
  | "budget"
  | "reports"
  | "upgrade"
  | "analytics"
  | "portfolio"
  | "netWorth"
  | "markets"
  | "dividends"
  | "paperTrading"
  | "goalPlanner"
  | "investVsCash"
  | "etfComparison"
  | "riskProfile"
  | "dcaCalculator"
  | "billDetection"
  | "riskWarnings"
  | "healthScore"
  | "taxCenter"
  | "security"
  | "settings";

type SidebarProps = {
  activeItem?: SidebarItem;
  onNavigate: (item: SidebarItem) => void;
};

type NavItem = {
  id: SidebarItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

export default function Sidebar({ activeItem = "overview", onNavigate }: SidebarProps) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const mainItems = useMemo<NavItem[]>(
    () => [
      { id: "overview", label: "Dashboard", icon: HomeIcon },
      { id: "forecast", label: "Forecast", icon: ChartBarIcon },
      { id: "transactions", label: "Transactions", icon: DocumentChartBarIcon },
    ],
    []
  );

  const cashflowItems = useMemo<NavItem[]>(
    () => [
      { id: "subscriptions", label: "Subscriptions", icon: CreditCardIcon },
      { id: "budget", label: "Cashflow", icon: BanknotesIcon },
    ],
    []
  );

  const trustItems = useMemo<NavItem[]>(
    () => [{ id: "reports", label: "Reports", icon: PresentationChartLineIcon }],
    []
  );

  const investingItems = useMemo<NavItem[]>(
    () => [
      { id: "portfolio", label: "Portfolio", icon: BriefcaseIcon },
      { id: "markets", label: "Markets", icon: GlobeAltIcon },
      { id: "netWorth", label: "Net Worth", icon: ScaleIcon },
    ],
    []
  );

  const accountItems = useMemo<NavItem[]>(
    () => [{ id: "upgrade", label: "Upgrade", icon: ArrowUpRightIcon, badge: "PRO" }],
    []
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      window.location.href = "/login";
    }
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = activeItem === item.id;
    const Icon = item.icon;

    return (
      <button
        type="button"
        onClick={() => {
          onNavigate(item.id);
          setIsOpen(false);
        }}
        className={[
          "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition",
          isActive
            ? "bg-[#2a0f4d] text-white shadow-[0_0_0_1px_rgba(168,85,247,0.18)]"
            : "text-white/70 hover:bg-white/5 hover:text-white",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 items-center justify-center rounded-xl border transition",
            isActive ? "border-white/10 bg-black/30" : "border-white/10 bg-black/20 group-hover:border-white/15",
          ].join(" ")}
        >
          <Icon className={["h-5 w-5", isActive ? "text-white" : "text-white/65 group-hover:text-white"].join(" ")} />
        </span>

        <span className="min-w-0 flex-1 truncate">{item.label}</span>

        {item.badge ? (
          <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
            {item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  const Section = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mt-6">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((it) => (
          <NavButton key={it.id} item={it} />
        ))}
      </div>
    </div>
  );

  const Shell = ({ mobile }: { mobile?: boolean }) => (
    <aside
      className={[
        "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-2xl shadow-black/70",
        mobile ? "h-full w-80 max-w-[86vw]" : "hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:w-72",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#6d28d9]/15 blur-3xl" />
        <div className="absolute -right-28 -bottom-28 h-80 w-80 rounded-full bg-[#a855f7]/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">MyAiBank</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/70">
                PREMIUM
              </p>
            </div>

            {mobile ? (
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white/80 transition hover:border-white/20 hover:text-white"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            ) : null}
          </div>

          <div className="mt-4 h-px w-full bg-white/10" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
          <Section title="Main" items={mainItems} />
          <Section title="Cashflow Control" items={cashflowItems} />
          <Section title="Investing" items={investingItems} />
          <Section title="Trust & Report" items={trustItems} />
          <Section title="Account" items={accountItems} />

          <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-[#3b0764]/40 to-[#1e1b4b]/25 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                <ShieldCheckIcon className="h-6 w-6 text-violet-200/90" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/90">Bank-Grade Security</p>
                <p className="mt-1 text-xs text-white/55">Your data is encrypted 256-bit.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:text-white"
          >
            Logout
          </button>
          <p className="mt-3 text-xs text-white/45">Support: hello@myaibank.ai</p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed left-4 top-[84px] z-40 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[#0b1020] shadow-lg shadow-black/60 transition hover:border-white/25"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6 text-white/85" />
      </button>

      <div
        className={[
          "fixed inset-0 z-50 lg:hidden transition",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <div
          className={[
            "absolute inset-0 bg-black/70 transition-opacity",
            isOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setIsOpen(false)}
        />
        <div
          className={[
            "relative h-full transform transition-transform duration-300",
            isOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="h-full p-4">
            <Shell mobile />
          </div>
        </div>
      </div>

      <Shell />
    </>
  );
}
