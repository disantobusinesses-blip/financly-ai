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
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

export type SidebarItem =
  | "overview"
  | "forecast"
  | "subscriptions"
  | "transactions"
  | "budget"
  | "reports"
  | "upgrade";

type SidebarProps = {
  activeItem?: SidebarItem;
  onNavigate: (item: SidebarItem) => void;
};

export default function Sidebar({ activeItem = "overview", onNavigate }: SidebarProps) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo(
    () =>
      [
        { id: "overview" as const, label: "Overview", icon: HomeIcon },
        { id: "forecast" as const, label: "Forecast", icon: ChartBarIcon },
        { id: "subscriptions" as const, label: "Subscriptions", icon: CreditCardIcon },
        { id: "transactions" as const, label: "Transactions", icon: DocumentChartBarIcon },
        { id: "budget" as const, label: "Budget", icon: BanknotesIcon },
        { id: "reports" as const, label: "Reports", icon: PresentationChartLineIcon },
        { id: "upgrade" as const, label: "Upgrade", icon: ArrowUpRightIcon },
      ] as const,
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

  const NavButton = ({
    id,
    label,
    Icon,
  }: {
    id: SidebarItem;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }) => {
    const isActive = activeItem === id;

    return (
      <button
        type="button"
        onClick={() => {
          onNavigate(id);
          setIsOpen(false);
        }}
        className={[
          "group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
          "border",
          isActive
            ? "border-[#1F0051]/70 bg-[#14002f] text-white shadow-[0_0_0_1px_rgba(31,0,81,0.45)]"
            : "border-white/10 bg-[#0b0b10] text-white/75 hover:border-white/20 hover:bg-[#101018] hover:text-white",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 items-center justify-center rounded-xl border transition",
            isActive ? "border-[#1F0051]/70 bg-[#0f001f]" : "border-white/10 bg-black/50 group-hover:border-white/20",
          ].join(" ")}
        >
          <Icon className={["h-5 w-5", isActive ? "text-white" : "text-white/70 group-hover:text-white"].join(" ")} />
        </span>

        <span className="flex-1">{label}</span>

        {id === "upgrade" && (
          <span className="rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70">
            Pro
          </span>
        )}
      </button>
    );
  };

  const Shell = ({ mobile }: { mobile?: boolean }) => (
    <aside
      className={[
        // NOTE: non-transparent (no backdrop-blur)
        "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/60",
        mobile ? "h-full w-80 max-w-[86vw]" : "hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:w-72",
      ].join(" ")}
    >
      {/* subtle internal lighting (still opaque) */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1F0051]/25 blur-3xl" />
        <div className="absolute -right-28 -bottom-24 h-72 w-72 rounded-full bg-white/[0.04] blur-3xl" />
      </div>

      <div className="relative flex h-full flex-col p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/60">
            <span className="h-5 w-5 rounded-full border-2 border-[#1F0051] bg-[#14002f]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">MyAiBank</p>
            <p className="truncate text-sm font-semibold text-white/90">Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map((it) => (
            <NavButton key={it.id} id={it.id} label={it.label} Icon={it.icon} />
          ))}
        </nav>

        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Logout
          </button>

          <p className="mt-4 text-xs text-white/45">Support: hello@myaibank.ai</p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile open button */}
      <button
        type="button"
        className="lg:hidden fixed left-4 top-[84px] z-40 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[#0b0b10] shadow-lg shadow-black/50 transition hover:border-white/30"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6 text-white/85" />
      </button>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsOpen(false)} />
          <div className="relative z-50 h-full">
            <Shell mobile />
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/60 text-white/80 transition hover:border-white/25 hover:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop */}
      <Shell />
    </>
  );
}
