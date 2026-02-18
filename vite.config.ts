import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'
import { getBasePath } from './src/config/vite.config'

// Format date in German format (DD.MM.YYYY)
function formatDateGerman(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use environment-aware base path for GitHub Pages deployment
  base: getBasePath(),
  define: {
    __BUILD_TIME__: JSON.stringify(formatDateGerman()),
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Put ALL node_modules in vendor chunk to avoid circular dependencies
          // This ensures React is only loaded once
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          // Application code
          return 'app';
        },
      },
    },
  },
})
