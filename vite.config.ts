import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local-first toddler game. No backend, no proxies, no external calls.
export default defineConfig({
  plugins: [react()],
  base: './',
})
