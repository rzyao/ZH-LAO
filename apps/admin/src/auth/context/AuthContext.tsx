import * as React from 'react'
import type { CurrentOperator, AuthStatus } from '../types'
import { can as canCheck } from '../permissions'
import type { Permission } from '../permissions'
import { setAccessToken } from '../token-store'
import { setForbiddenHandler, setUnauthorizedHandler } from '@/api/client'
import { changeAdminPassword, getCurrentOperator, loginAdmin, logoutAdmin } from '../api'
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
  refreshPermissions: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
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

  const refreshPermissions = React.useCallback(async () => {
    try {
      const current = await getCurrentOperator()
      setOperator(current.operator)
      setPermissions(current.permissions)
      const currentSession = readAdminSession()
      if (currentSession) {
        writeAdminSession({
          ...currentSession,
          operator: current.operator,
          permissions: current.permissions,
        })
      }
    } catch {
      // Failed to refresh operator/permissions; let standard error handlers deal with it
    }
  }, [])

  React.useEffect(() => {
    setAccessToken(persisted?.accessToken ?? null)
    // 本地权限只用于首屏恢复；随后立即以服务端为准刷新。
    // 角色新增权限后，已登录的管理员无需退出再登录即可看到新菜单。
    if (persisted) void refreshPermissions()
    setUnauthorizedHandler(() => {
      setAccessToken(null)
      clearAdminSession()
      setOperator(null)
      setPermissions([])
    })
    setForbiddenHandler(() => {
      // 403 forbidden -> silently refresh /me permissions (SC-007)
      void refreshPermissions()
    })
    return () => {
      setUnauthorizedHandler(null)
      setForbiddenHandler(null)
    }
  }, [persisted, refreshPermissions])

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
      refreshPermissions,
      changePassword: async (currentPassword, newPassword) => {
        await changeAdminPassword(currentPassword, newPassword)
        // Backend revokes all sessions on password change -> clear local session & reset auth
        setAccessToken(null)
        clearAdminSession()
        setOperator(null)
        setPermissions([])
      },
    }),
    [status, operator, permissions, refreshPermissions],
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
