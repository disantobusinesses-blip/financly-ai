import React from "react";
import { triggerHaptic } from "../utils/iosUtils";

type TouchButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  ariaLabel?: string;
  haptic?: 'light' | 'medium' | 'heavy';
};

/**
 * iOS-optimized button component with haptic feedback and touch-friendly design
 */
const TouchButton: React.FC<TouchButtonProps> = ({
  onClick,
  children,
  className = "",
  type = "button",
  disabled = false,
  ariaLabel,
  haptic = 'light',
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      triggerHaptic(haptic);
      onClick();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        "touch-feedback transition-all active:scale-95 min-h-[44px]",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
};

export default TouchButton;
