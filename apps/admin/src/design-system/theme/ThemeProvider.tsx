import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from './theme-context'
import type { ThemeMode } from './theme-context'
import {
  applyTheme,
  listenToSystemTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
} from './theme-utils'

interface ThemeProviderProps {
  children: ReactNode
  /** Optional initial mode; defaults to stored value or 'system'. */
  defaultMode?: ThemeMode
}

/**
 * Provides theme state with localStorage persistence and system-follow support.
 * Applied before render on first load to avoid a flash of the wrong theme.
 */
export function ThemeProvider({ children, defaultMode = 'system' }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return readStoredTheme() ?? defaultMode
  })
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(mode),
  )

  // Keep the document in sync with the resolved theme on first mount.
  useEffect(() => {
    applyTheme(resolveTheme(mode))
  }, [mode])

  // When following the system, re-apply when the OS preference changes.
  useEffect(() => {
    if (mode !== 'system') return
    applyTheme(systemTheme)
    const unsubscribe = listenToSystemTheme((theme) => {
      setSystemTheme(theme)
      applyTheme(theme)
    })
    return unsubscribe
  }, [mode, systemTheme])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    storeTheme(next)
    applyTheme(resolveTheme(next))
  }, [])

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const nextResolved = resolveTheme(prev) === 'light' ? 'dark' : 'light'
      const next: ThemeMode = nextResolved
      storeTheme(next)
      applyTheme(nextResolved)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme: mode === 'system' ? systemTheme : mode,
      setMode,
      toggle,
    }),
    [mode, systemTheme, setMode, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
