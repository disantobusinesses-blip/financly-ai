import React from "react";
import { ArrowRightIcon } from "./icon/Icon";

interface ToolTileProps {
  children: React.ReactNode;
  label?: string;
}

const ToolTile: React.FC<ToolTileProps> = ({ children, label }) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur transition hover:border-white/20">
    <div className="pointer-events-none absolute inset-0 opacity-60">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1F0051]/25 blur-3xl" />
      <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
    </div>

    <div className="relative p-5 sm:p-6">
      <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white">
        <ArrowRightIcon className="h-4 w-4" />
      </div>

      {label && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{label}</p>}

      {children}
    </div>
  </div>
);

export default ToolTile;
