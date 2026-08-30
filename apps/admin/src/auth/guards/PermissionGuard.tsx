import * as React from 'react'
import { useAuth } from '../context/AuthContext'
import type { Permission } from '../permissions'
import { Lock } from 'lucide-react'

export interface PermissionGuardProps {
  permission: Permission
  children: React.ReactNode
  /** Rendered when the operator lacks `permission`. */
  fallback?: React.ReactNode
}

/**
 * Renders children only when the current operator has `permission`.
 * Fails closed: missing permission shows a compact fallback.
 */
export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { can } = useAuth()
  if (!can(permission)) {
    return (
      <>
        {fallback ?? (
          <div
            role="status"
            className="flex items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground"
          >
            <Lock aria-hidden className="size-3.5" />
            无权限：{permission}
          </div>
        )}
      </>
    )
  }
  return <>{children}</>
}
