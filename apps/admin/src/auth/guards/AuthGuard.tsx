import * as React from 'react'
import { useAuth } from '../context/AuthContext'
import { InlineLoading } from '@/components/feedback/loading'

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
 * The Foundation ships the mechanism only; the actual session check is wired
 * by the Identity/Operations phases. Fails closed by default (anonymous users
 * see `fallback`).
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
    return <>{fallback ?? null}</>
  }
  return <>{children}</>
}
