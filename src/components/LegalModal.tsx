import React from "react";

interface LegalModalProps {
  title: string;
  body: string;
  isOpen: boolean;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ title, body, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-black text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/60 transition hover:text-white"
          aria-label="Close legal modal"
        >
          ✕
        </button>
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold tracking-wide">{title}</h2>
          <p className="text-xs text-white/60">Scroll to review the full document.</p>
        </div>
        <div className="custom-scrollbar max-h-[70vh] overflow-y-auto px-6 py-6 text-sm leading-relaxed text-white/85 whitespace-pre-line">
          {body}
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
