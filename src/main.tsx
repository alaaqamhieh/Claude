import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted, bundled font (no network at runtime).
import '@fontsource/baloo-2/400.css'
import '@fontsource/baloo-2/600.css'
import '@fontsource/baloo-2/700.css'
import '@fontsource/baloo-2/800.css'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
