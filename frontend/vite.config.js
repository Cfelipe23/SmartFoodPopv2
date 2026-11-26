import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // compartir.ps1: el build de producción se sirve con `vite preview` detrás de un túnel de Cloudflare.
  // El navegador pide /api al mismo origen y Vite lo reenvía al backend local (el celular no ve localhost:5000).
  preview: {
    port: 4173,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'],
    proxy: { '/api': 'http://localhost:5000' }
  }
})
