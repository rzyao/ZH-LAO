import * as React from 'react'
import type { CurrentOperator, AuthStatus } from '../types'
import { can as canCheck } from '../permissions'
import type { Permission } from '../permissions'

export interface AuthContextValue {
  status: AuthStatus
  operator: CurrentOperator | null
  /** Granted permission keys; may include wildcard patterns. */
  permissions: readonly string[]
  can: (permission: Permission) => boolean
  /** Skeleton seam — replaced by real Identity/Operations login later. */
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
  const [operator, setOperator] = React.useState<CurrentOperator | null>(
    initialState?.operator ?? null,
  )
  const [permissions, setPermissions] = React.useState<readonly string[]>(
    initialState?.permissions ?? [],
  )

  const status: AuthStatus = operator ? 'authenticated' : 'anonymous'

  const value = React.useMemo<AuthContextValue>(
    () => ({
      status,
      operator,
      permissions,
      can: (permission) => canCheck(permissions, permission),
      setAuthenticated: (nextOperator, nextPermissions = []) => {
        setOperator(nextOperator)
        setPermissions(nextPermissions)
      },
      signOut: () => {
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
