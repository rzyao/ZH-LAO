import { CircleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  /** Explicit message; overrides anything derived from `error`. */
  message?: string
  error?: unknown
  requestId?: string
  onRetry?: () => void
  icon?: LucideIcon
  className?: string
}

function errorInfo(error: unknown): { message: string; requestId?: string } {
  if (error instanceof ApiError) {
    return { message: error.message, requestId: error.requestId }
  }
  // For non-ApiError failures show only a safe generic message — never raw
  // error messages or stack traces that could leak internal details.
  return { message: '发生未知错误，请稍后重试。' }
}

/**
 * Unified error state. Shows a safe, generic message plus an optional
 * request id for support and a retry action. Backend stack traces are
 * never displayed.
 */
export function ErrorState({
  title = '加载失败',
  message,
  error,
  requestId,
  onRetry,
  icon: Icon = CircleAlert,
  className,
}: ErrorStateProps) {
  const info = errorInfo(error)
  const displayMessage = message ?? info.message
  const displayRequestId = requestId ?? info.requestId

  return (
    <div
      role="alert"
      className={cn(
        'flex h-full min-h-[240px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <Icon aria-hidden className="size-6" />
      </div>
      <h3 className="mt-1 text-base font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{displayMessage}</p>
      {displayRequestId ? (
        <p className="mt-1 font-mono text-xs text-muted-foreground/70">
          请求 ID：{displayRequestId}
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </div>
  )
}
