import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages serves the site under /noor-electric/; Vercel serves it from the root.
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/noor-electric/',
})
