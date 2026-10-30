import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Built docs behind a Cloudflare quick tunnel (vite preview only; the dev server stays localhost-only).
  preview: { allowedHosts: ['.trycloudflare.com'] },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as never)
