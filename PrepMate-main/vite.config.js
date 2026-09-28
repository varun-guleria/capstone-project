import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use the repository name only in the published GitHub Pages build.
  // For Netlify, the base path is the root. For GitHub Pages, it would be "/capstone-project/".
  base: "/",
})
