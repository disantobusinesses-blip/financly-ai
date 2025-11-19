import React, { useState } from "react";
import LegalModal from "./LegalModal";
import { PRIVACY_CONTENT, TERMS_CONTENT } from "../legal/legalContent";

const LegalFooter: React.FC = () => {
  const [modal, setModal] = useState<null | "privacy" | "terms">(null);

  return (
    <>
      <div className="mt-16 space-y-4 text-center text-xs text-white/70">
        <p className="text-sm text-white/80">
          MyAiBank provides general financial insights using formulas only, and is not a licensed financial adviser.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-white">
          <button
            type="button"
            onClick={() => setModal("privacy")}
            className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-light hover:text-white"
          >
            Privacy Policy
          </button>
          <span className="text-white/50">|</span>
          <button
            type="button"
            onClick={() => setModal("terms")}
            className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-light hover:text-white"
          >
            Terms of Use
          </button>
          <span className="text-white/50">|</span>
          <a
            href="mailto:info@myaibank.ai"
            className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-light hover:text-white"
          >
            Contact
          </a>
        </div>
        <p className="text-sm text-white/60">© 2025 MyAiBank Pty Ltd – All rights reserved</p>
      </div>

      <LegalModal
        title={modal === "privacy" ? "Privacy Policy" : "Terms and Conditions"}
        body={modal === "privacy" ? PRIVACY_CONTENT : TERMS_CONTENT}
        isOpen={modal !== null}
        onClose={() => setModal(null)}
      />
    </>
  );
};

export default LegalFooter;
