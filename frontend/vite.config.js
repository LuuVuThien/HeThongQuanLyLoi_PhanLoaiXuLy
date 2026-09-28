import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Cấu hình Vite với plugin React và Tailwind CSS
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
