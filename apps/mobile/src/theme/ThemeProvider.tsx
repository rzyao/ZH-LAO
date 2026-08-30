import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { PREFERENCE_KEYS, preferencesStorage } from '../storage';

import { DEFAULT_THEME_ID, THEME_PRESETS } from './presets';
import type { AppTheme, AppThemeTokens } from './presets';

export interface ThemeContextValue {
  readonly theme: AppTheme;
  readonly colors: AppThemeTokens;
  readonly themeId: string;
  readonly isHydrated: boolean;
  readonly setThemeId: (id: string) => void;
  readonly availableThemes: readonly AppTheme[];
}

function resolveTheme(themeId: string | null): AppTheme {
  if (!themeId) {
    return THEME_PRESETS[0]!;
  }
  return THEME_PRESETS.find((candidate) => candidate.id === themeId) ?? THEME_PRESETS[0]!;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  readonly children: React.ReactNode;
  /** Storage override used by tests. Defaults to the app preferences store. */
  readonly storage?: Pick<typeof preferencesStorage, 'getString' | 'setString'>;
  /** Pre-resolved initial theme id; skips async hydration when provided. */
  readonly initialThemeId?: string | null;
}

/**
 * V2 theme provider.
 *
 * Differences from the legacy implementation:
 * - persistence is asynchronous and explicit (`isHydrated` guards first paint
 *   from flashing the wrong palette);
 * - the resolved palette is only ever read from the ACTIVE theme, never from a
 *   statically exported default palette.
 */
export function ThemeProvider({
  children,
  storage = preferencesStorage,
  initialThemeId,
}: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<string>(() =>
    resolveTheme(initialThemeId ?? null).id,
  );
  const [isHydrated, setIsHydrated] = useState<boolean>(initialThemeId !== undefined);

  useEffect(() => {
    if (initialThemeId !== undefined) {
      return;
    }
    let cancelled = false;
    void storage.getString(PREFERENCE_KEYS.themeId).then((stored) => {
      if (cancelled) {
        return;
      }
      if (stored) {
        setThemeIdState(resolveTheme(stored).id);
      }
      setIsHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [initialThemeId, storage]);

  const setThemeId = useCallback(
    (id: string) => {
      const next = resolveTheme(id);
      setThemeIdState(next.id);
      void storage.setString(PREFERENCE_KEYS.themeId, next.id);
    },
    [storage],
  );

  const value = useMemo<ThemeContextValue>(() => {
    const theme = resolveTheme(themeId);
    return {
      theme,
      colors: theme.tokens,
      themeId: theme.id,
      isHydrated,
      setThemeId,
      availableThemes: THEME_PRESETS,
    };
  }, [themeId, isHydrated, setThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return context;
}

export { DEFAULT_THEME_ID, THEME_PRESETS };
export type { AppTheme, AppThemeTokens };
