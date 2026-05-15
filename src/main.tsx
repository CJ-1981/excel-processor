import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ColorModeProvider } from './ColorModeContext'
import './index.css'
import App from './App.tsx'
// Import i18n configuration to initialize i18next
import './i18n/config';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  </StrictMode>,
)
