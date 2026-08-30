import type { ResolvedTheme, ThemeMode } from './theme-context'
import { THEME_STORAGE_KEY } from './theme-context'

export function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return 'light'
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

export function readStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return null
}

export function storeTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, mode)
}

/**
 * Apply a resolved theme to the document root and keep the browser UI
 * (scrollbars, form controls) consistent via `color-scheme`.
 */
export function applyTheme(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export function listenToSystemTheme(callback: (theme: ResolvedTheme) => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches ? 'dark' : 'light')
  }
  media.addEventListener('change', handler)
  return () => media.removeEventListener('change', handler)
}
