import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works at https://<user>.github.io/<repo>/
  base: './',
  plugins: [react()],
})
