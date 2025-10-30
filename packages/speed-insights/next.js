import { useEffect } from "react";

const SCRIPT_ID = "__vercel_speed_insights";
const SCRIPT_SRC = "https://speed.vercel.com/insights.js";

export function SpeedInsights(props = {}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.defer = true;
    script.dataset.source = "local-shim";
    if (props?.sampleRate && typeof props.sampleRate === "number") {
      script.dataset.sampleRate = String(props.sampleRate);
    }
    document.head.appendChild(script);
  }, [props?.sampleRate]);

  return null;
}
