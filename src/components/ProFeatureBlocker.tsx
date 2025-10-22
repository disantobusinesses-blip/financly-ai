// src/components/ProFeatureBlocker.tsx
import React from "react";
import UpgradeModal from "./UpgradeModal";

interface ProFeatureBlockerProps {
  children: React.ReactNode;
  featureTitle: string;
  teaserText: string;
}

const ProFeatureBlocker: React.FC<ProFeatureBlockerProps> = ({
  children,
  featureTitle,
  teaserText,
}) => {
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false);

  return (
    <div className="relative">
      {/* The blurred locked content */}
      <div className="pointer-events-none blur-sm select-none opacity-60">
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center p-4 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">{featureTitle}</h3>
        <p className="text-sm text-gray-200 mb-4">{teaserText}</p>
        <button
          onClick={() => setIsUpgradeOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-primary-hover transition"
        >
          Upgrade to Pro
        </button>
      </div>

      {/* Upgrade Modal */}
      {isUpgradeOpen && <UpgradeModal />}
    </div>
  );
};

export default ProFeatureBlocker;
