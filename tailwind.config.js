/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Be Vietnam Pro', 'sans-serif'],
      },
      colors: {
        background: 'var(--color-background)',
        'sidebar-bg': 'var(--color-sidebar-bg)',
        'content-bg': 'var(--color-content-bg)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'border-color': 'var(--color-border-color)',
        'primary-light': 'var(--color-primary-light)',
        'secondary-light': 'var(--color-secondary-light)',
        'primary-text': 'var(--color-primary-text)',
        'primary': '#4F46E5',
        'primary-hover': '#4338CA',
        'secondary': '#10B981',
        'warning': '#F59E0B',
      }
    }
  },
  plugins: [],
}
