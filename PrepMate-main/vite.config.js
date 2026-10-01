import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    })
  ],
  // Use the repository name only in the published GitHub Pages build.
  // For Netlify, the base path is the root. For GitHub Pages, it would be "/capstone-project/".
  base: "/",
})
