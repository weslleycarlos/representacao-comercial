import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/gestor': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/vendedor': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
    },
  },
})
