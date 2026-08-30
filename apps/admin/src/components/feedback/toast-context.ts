import * as React from 'react'

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
}

export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant: ToastVariant
  duration: number
  action?: ToastAction
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
}

export const ToastContext = React.createContext<ToastContextValue | null>(null)
