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
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for React core libraries and related
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/@dnd-kit') ||
              id.includes('node_modules/@hello-pangea/dnd')) {
            return 'vendor-react';
          }

          // Vendor chunk for MUI components and Emotion styling
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) {
            return 'vendor-mui';
          }

          // Vendor chunk for Recharts library
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }

          // Vendor chunk for data processing libraries (xlsx, jspdf)
          if (id.includes('node_modules/xlsx') ||
              id.includes('node_modules/jspdf') ||
              id.includes('node_modules/@types/jspdf')) {
            return 'vendor-data';
          }

          // Vendor chunk for other third-party libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          // Default chunk for application code
          return 'app';
        },
      },
    },
  },
})
