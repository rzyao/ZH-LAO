import * as React from 'react'
import { useAuth } from '../context/AuthContext'
import { InlineLoading } from '@/components/feedback/loading'
import { Navigate } from '@tanstack/react-router'

export interface AuthGuardProps {
  children: React.ReactNode
  /** Rendered when the user is not authenticated. */
  fallback?: React.ReactNode
  /** Show loading while status is unknown. */
  loadingFallback?: React.ReactNode
}

/**
 * Guards a route/subtree for authenticated operators.
 *
 * Fails closed by default: anonymous users are redirected to the login page.
 */
export function AuthGuard({
  children,
  fallback,
  loadingFallback,
}: AuthGuardProps) {
  const { status } = useAuth()

  if (status === 'unknown') {
    return <>{loadingFallback ?? <InlineLoading label="正在检查登录状态…" />}</>
  }
  if (status !== 'authenticated') {
    return <>{fallback ?? <Navigate to="/login" replace />}</>
  }
  return <>{children}</>
}
