import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
<<<<<<< HEAD
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/models': {
        target: 'http://localhost:3001',
        changeOrigin: true,
=======
        changeOrigin: true
>>>>>>> c29aa2cfa9e6dbdb57c3de004300c5bc2465f359
      }
    }
  }
})
