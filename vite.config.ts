import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use different base path for development vs production
  base: process.env.NODE_ENV === 'production' ? '/excel-processor/' : '/',
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString()),
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
})
