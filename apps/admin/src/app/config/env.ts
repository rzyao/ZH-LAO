export type AppEnvironment = 'development' | 'test' | 'production'

export interface AppEnv {
  /** V2 backend API base URL. Falls back to same-origin `/api`. */
  apiBaseUrl: string
  appEnvironment: AppEnvironment
  /** Whether the internal design-system showcase is enabled. */
  enableDesignSystem: boolean
}

function parseEnvironment(): AppEnvironment {
  const raw = import.meta.env.VITE_APP_ENV
  if (raw === 'production' || raw === 'test') return raw
  return 'development'
}

/**
 * Central, validated app configuration. Frontend env vars are PUBLIC by
 * definition — no server secrets may ever live here.
 */
export const env: AppEnv = {
  apiBaseUrl:
    typeof import.meta.env.VITE_API_BASE_URL === 'string' &&
    import.meta.env.VITE_API_BASE_URL.length > 0
      ? import.meta.env.VITE_API_BASE_URL
      : '/api',
  appEnvironment: parseEnvironment(),
  enableDesignSystem: import.meta.env.VITE_ENABLE_DESIGN_SYSTEM !== 'false',
}
