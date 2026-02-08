import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'

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
  // Use different base path for development vs production
  base: process.env.NODE_ENV === 'production' ? '/excel-processor/' : '/',
  define: {
    __BUILD_TIME__: JSON.stringify(formatDateGerman()),
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
})
