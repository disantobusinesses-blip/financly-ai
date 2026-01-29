import React from "react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import { triggerHaptic } from "../utils/iosUtils";

type Theme = 'light' | 'dark' | 'system';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: Theme) => {
    triggerHaptic('light');
    setTheme(newTheme);
  };

  const themes: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1020]/50 p-4">
      <h3 className="text-sm font-semibold text-white/90 mb-3">Appearance</h3>
      <div className="flex gap-2">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <button
              key={themeOption.value}
              type="button"
              onClick={() => handleThemeChange(themeOption.value)}
              className={[
                "flex-1 flex flex-col items-center gap-2 rounded-xl px-3 py-3 transition-all min-h-[44px]",
                "active:scale-95 touch-feedback",
                isActive
                  ? "bg-violet-600/90 text-white shadow-lg shadow-violet-900/50"
                  : "bg-white/5 text-white/60 hover:bg-white/10",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-semibold">{themeOption.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeToggle;

