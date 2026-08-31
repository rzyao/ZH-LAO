import * as React from 'react'
import type { CurrentOperator, AuthStatus } from '../types'
import { can as canCheck } from '../permissions'
import type { Permission } from '../permissions'
import { setAccessToken } from '../token-store'
import { setUnauthorizedHandler } from '@/api/client'
import { getCurrentOperator, loginAdmin, logoutAdmin } from '../api'
import { clearAdminSession, readAdminSession, writeAdminSession, type AdminSession } from '../session-store'

export interface AuthContextValue {
  status: AuthStatus
  operator: CurrentOperator | null
  /** Granted permission keys; may include wildcard patterns. */
  permissions: readonly string[]
  can: (permission: Permission) => boolean
  login: (username: string, password: string) => Promise<void>
  setAuthenticated: (operator: CurrentOperator, permissions?: string[]) => void
  signOut: () => void
}

export const AuthContext = React.createContext<AuthContextValue | null>(null)

export interface AuthProviderProps {
  children: React.ReactNode
  /**
   * Test / integration seam only. Production never passes an operator here —
   * real authentication arrives with the Identity/Operations phases.
   */
  initialState?: {
    operator: CurrentOperator
    permissions?: string[]
  }
}

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const persisted = React.useMemo(() => initialState ? null : readAdminSession(), [initialState])
  const [operator, setOperator] = React.useState<CurrentOperator | null>(
    initialState?.operator ?? persisted?.operator ?? null,
  )
  const [permissions, setPermissions] = React.useState<readonly string[]>(
    initialState?.permissions ?? persisted?.permissions ?? [],
  )

  React.useEffect(() => {
    setAccessToken(persisted?.accessToken ?? null)
    setUnauthorizedHandler(() => {
      setAccessToken(null)
      clearAdminSession()
      setOperator(null)
      setPermissions([])
    })
    return () => setUnauthorizedHandler(null)
  }, [persisted])

  const status: AuthStatus = operator ? 'authenticated' : 'anonymous'

  const value = React.useMemo<AuthContextValue>(
    () => ({
      status,
      operator,
      permissions,
      can: (permission) => canCheck(permissions, permission),
      login: async (username, password) => {
        try {
          const credentials = await loginAdmin(username, password)
          setAccessToken(credentials.access_token)
          const current = await getCurrentOperator()
          const session: AdminSession = {
            accessToken: credentials.access_token,
            refreshToken: credentials.refresh_token,
            operator: current.operator,
            permissions: current.permissions,
          }
          writeAdminSession(session)
          setOperator(current.operator)
          setPermissions(current.permissions)
        } catch (error) {
          setAccessToken(null)
          throw error
        }
      },
      setAuthenticated: (nextOperator, nextPermissions = []) => {
        setAccessToken(null)
        clearAdminSession()
        setOperator(nextOperator)
        setPermissions(nextPermissions)
      },
      signOut: () => {
        const refreshToken = readAdminSession()?.refreshToken
        if (refreshToken) void logoutAdmin(refreshToken).catch(() => undefined)
        setAccessToken(null)
        clearAdminSession()
        setOperator(null)
        setPermissions([])
      },
    }),
    [status, operator, permissions],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return context
}
