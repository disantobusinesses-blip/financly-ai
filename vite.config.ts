import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vercel/speed-insights/next': path.resolve(__dirname, 'packages/speed-insights/next.js'),
    },
  },
})
