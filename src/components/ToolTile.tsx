import React from "react";
import { ArrowRightIcon } from "./icon/Icon";

interface ToolTileProps {
  children: React.ReactNode;
  label?: string;
}

const ToolTile: React.FC<ToolTileProps> = ({ children, label }) => (
  <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition duration-150 hover:border-white/20 hover:bg-white/[0.04]">
    <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/70 transition group-hover:border-white/30 group-hover:text-white">
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </div>
    {label && (
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{label}</p>
    )}
    <div className="text-white">{children}</div>
  </div>
);

export default ToolTile;
