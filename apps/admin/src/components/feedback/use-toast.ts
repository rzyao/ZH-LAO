import * as React from 'react'
import { ToastContext } from './toast-context'
import type { ToastOptions } from './toast-context'

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within <ToastProvider>')
  }
  return context
}

/** Convenience helpers with preset variants. */
export function useToastApi() {
  const { toast } = useToast()
  return React.useMemo(
    () => ({
      success: (options: Omit<ToastOptions, 'variant'>) =>
        toast({ ...options, variant: 'success' }),
      error: (options: Omit<ToastOptions, 'variant'>) =>
        toast({ ...options, variant: 'danger' }),
      warning: (options: Omit<ToastOptions, 'variant'>) =>
        toast({ ...options, variant: 'warning' }),
      info: (options: Omit<ToastOptions, 'variant'>) =>
        toast({ ...options, variant: 'info' }),
      default: toast,
    }),
    [toast],
  )
}
