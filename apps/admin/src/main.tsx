import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
} from './design-system/theme/theme-utils'

// Apply the persisted/system theme before first paint to avoid a flash.
applyTheme(resolveTheme(readStoredTheme() ?? 'system'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
