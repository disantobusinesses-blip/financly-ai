/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Be Vietnam Pro", "sans-serif"],
      },
      colors: {
        // 🌙 Core backgrounds
        background: "var(--color-background)",
        "sidebar-bg": "var(--color-sidebar-bg)",
        "content-bg": "var(--color-content-bg)",

        // 📝 Text colors
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",

        // ⬜ Borders
        "border-color": "var(--color-border-color)",

        // 🎨 Brand Colors
        primary: "#4F46E5", // Dark Purple
        "primary-hover": "#4338CA",
        "primary-light": "#E0E7FF",
        "primary-text": "#FFFFFF",

        secondary: "#14B8A6", // Teal
        "secondary-hover": "#0D9488",
        "secondary-light": "#CCFBF1",

        // ⚠️ Status Colors
        success: "#22C55E",
        warning: "#FACC15",
        error: "#EF4444",

        // 🎨 Accents
        accent: {
          red: "#EF4444",
          yellow: "#FACC15",
          green: "#22C55E",
        },

        // ⚫ Neutral Scale
        neutral: {
          50: "#F9FAFB",  // light background
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827", // dark background
        },
      },
    },
  },
  plugins: [],
};
