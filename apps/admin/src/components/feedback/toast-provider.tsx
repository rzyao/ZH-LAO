import * as React from 'react'
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToastContext } from './toast-context'
import type { ToastItem, ToastOptions, ToastVariant } from './toast-context'
import { createRequestId } from '@/api/client'

const DEFAULT_DURATION = 5000

const iconByVariant: Record<ToastVariant, React.ReactNode> = {
  default: <Info aria-hidden className="size-4 text-muted-foreground" />,
  success: <CheckCircle2 aria-hidden className="size-4 text-success" />,
  warning: <TriangleAlert aria-hidden className="size-4 text-warning" />,
  danger: <CircleAlert aria-hidden className="size-4 text-destructive" />,
  info: <Info aria-hidden className="size-4 text-info" />,
}

const toastItemClass: Record<ToastVariant, string> = {
  default: 'border-border',
  success: 'border-success/40',
  warning: 'border-warning/50',
  danger: 'border-destructive/40',
  info: 'border-info/40',
}

/**
 * Toast / notification provider.
 *
 * Lightweight custom implementation (no third-party toast library) so the
 * foundation owns its notification contract. Complex errors belong in page /
 * form error states, not toasts.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = React.useCallback(
    (options: ToastOptions): string => {
      const id = createRequestId()
      const item: ToastItem = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? 'default',
        duration: options.duration ?? DEFAULT_DURATION,
        action: options.action,
      }
      setToasts((prev) => [...prev.slice(-4), item])
      if (item.duration > 0) {
        window.setTimeout(() => dismiss(id), item.duration)
      }
      return id
    },
    [dismiss],
  )

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.variant === 'danger' ? 'alert' : 'status'}
            data-testid="toast"
            className={cn(
              'pointer-events-auto flex w-full items-start gap-2 rounded-md border bg-popover p-3 text-popover-foreground shadow-md',
              toastItemClass[item.variant],
            )}
          >
            <span className="mt-0.5 shrink-0">{iconByVariant[item.variant]}</span>
            <div className="min-w-0 flex-1">
              {item.title ? <p className="text-sm font-medium">{item.title}</p> : null}
              {item.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
              {item.action ? (
                <button
                  type="button"
                  className="mt-1 text-sm font-medium text-primary hover:underline"
                  onClick={() => {
                    item.action?.onClick()
                    dismiss(item.id)
                  }}
                >
                  {item.action.label}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="关闭通知"
              className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => dismiss(item.id)}
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
