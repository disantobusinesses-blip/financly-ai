import React from "react";

interface TutorialButtonProps {
  onClick: () => void;
}

const TutorialButton: React.FC<TutorialButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
    >
      🔍 Need a tour?
    </button>
  );
};

export default TutorialButton;
