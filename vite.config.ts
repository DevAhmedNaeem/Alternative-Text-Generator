import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api/agentrouter': {
        target: 'https://agentrouter.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/agentrouter/, ''),
        headers: {
          'User-Agent': 'cline/3.0.0',
        },
      },
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, ''),
      },
    },
  },
})
