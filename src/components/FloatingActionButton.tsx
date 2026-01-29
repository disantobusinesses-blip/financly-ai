import React, { useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

type FABAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
};

type FloatingActionButtonProps = {
  actions?: FABAction[];
  position?: "bottom-right" | "bottom-left";
};

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions = [],
  position = "bottom-right",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    // Trigger haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (action: FABAction) => {
    // Trigger haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    action.onClick();
    setIsExpanded(false);
  };

  const positionClasses =
    position === "bottom-right"
      ? "right-4 md:right-6"
      : "left-4 md:left-6";

  return (
    <div
      className={`lg:hidden fixed z-40 ${positionClasses}`}
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
      }}
    >
      {/* Expanded Actions */}
      {isExpanded && actions.length > 0 && (
        <div className="absolute bottom-16 right-0 mb-3 flex flex-col gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleActionClick(action)}
                className="group flex items-center gap-2 transition-all active:scale-95"
                style={{
                  animation: `slideInUp 0.2s ease ${index * 0.05}s both`,
                }}
              >
                <span className="rounded-full bg-[#0b1020]/95 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl shadow-lg border border-white/10">
                  {action.label}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/90 shadow-lg backdrop-blur-xl transition-transform group-active:scale-95">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 shadow-2xl shadow-violet-900/50 transition-all active:scale-90"
        aria-label={isExpanded ? "Close menu" : "Open quick actions"}
      >
        <div className="relative">
          <PlusIcon
            className={[
              "h-7 w-7 text-white transition-all duration-300",
              isExpanded ? "rotate-45 opacity-0" : "rotate-0 opacity-100",
            ].join(" ")}
          />
          <XMarkIcon
            className={[
              "absolute inset-0 h-7 w-7 text-white transition-all duration-300",
              isExpanded ? "rotate-0 opacity-100" : "-rotate-45 opacity-0",
            ].join(" ")}
          />
        </div>
      </button>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingActionButton;
