import React from "react";
import {
  HomeIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  DocumentChartBarIcon as DocumentChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from "@heroicons/react/24/solid";
import type { SidebarItem } from "./Sidebar";

type MobileBottomNavProps = {
  activeItem: SidebarItem;
  onNavigate: (item: SidebarItem) => void;
};

type NavItem = {
  id: SidebarItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
};

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeItem, onNavigate }) => {
  const navItems: NavItem[] = [
    { id: "overview", label: "Dashboard", icon: HomeIcon, iconSolid: HomeIconSolid },
    { id: "analytics", label: "Analytics", icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
    { id: "reports", label: "Reports", icon: DocumentChartBarIcon, iconSolid: DocumentChartBarIconSolid },
    { id: "settings", label: "Settings", icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
  ];

  const handleNavClick = (item: SidebarItem) => {
    // Trigger haptic feedback on iOS devices
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    onNavigate(item);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0b1020]/95 backdrop-blur-xl"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = isActive ? item.iconSolid : item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all active:scale-95"
              aria-label={item.label}
            >
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-xl transition-all",
                  isActive ? "scale-110" : "",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-6 w-6 transition-colors",
                    isActive ? "text-violet-400" : "text-white/60",
                  ].join(" ")}
                />
              </div>
              <span
                className={[
                  "text-[10px] font-semibold transition-colors",
                  isActive ? "text-violet-300" : "text-white/50",
                ].join(" ")}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
