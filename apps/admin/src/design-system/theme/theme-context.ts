import { createContext } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  /** User preference. */
  mode: ThemeMode
  /** Resolved theme actually applied to the document. */
  resolvedTheme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  /** Toggle between resolved light/dark. */
  toggle: () => void
}

export const THEME_STORAGE_KEY = 'zh-lao-admin-theme'

export const ThemeContext = createContext<ThemeContextValue | null>(null)
