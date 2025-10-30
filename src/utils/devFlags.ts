export const isDevProUnlocked =
  import.meta.env.VITE_DEV_UNLOCK_PRO === "true" ||
  (import.meta.env.DEV && import.meta.env.VITE_DEV_UNLOCK_PRO !== "false");
