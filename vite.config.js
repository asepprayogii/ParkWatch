import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Keluarkan tesseract.js dari pre-bundling Vite
    // Supaya tidak di-analisis saat build dan tidak menyebabkan timeout
    exclude: ['tesseract.js'],
  },
  build: {
    rollupOptions: {
      // Pisahkan tesseract.js jadi chunk tersendiri (lazy loaded)
      // supaya ukuran bundle utama tetap kecil
      output: {
        manualChunks: {
          tesseract: ['tesseract.js'],
        },
      },
    },
  },
})