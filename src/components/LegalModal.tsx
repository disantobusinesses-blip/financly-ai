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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl dark:bg-neutral-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close legal modal"
        >
          ✕
        </button>
        <div className="border-b border-slate-200 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Scroll to review the full document.</p>
        </div>
        <div className="custom-scrollbar max-h-[65vh] overflow-y-auto px-6 py-5 text-sm leading-relaxed whitespace-pre-line">
          {body}
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
