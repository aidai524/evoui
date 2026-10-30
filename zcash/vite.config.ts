import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Non-VITE_ vars stay server-side: TYPESAFE_API_KEY is injected by the proxy, never bundled.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.CURATE_API_TARGET ?? 'http://localhost:4123'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          headers: env.TYPESAFE_API_KEY ? { 'x-api-key': env.TYPESAFE_API_KEY } : {},
        },
      },
    },
  }
})
