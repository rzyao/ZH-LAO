import * as React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/api/query'
import { ThemeProvider } from '@/design-system/theme/ThemeProvider'
import { ToastProvider } from '@/components/feedback/toast-provider'
import { AuthProvider } from '@/auth/context/AuthContext'

/**
 * App-wide providers. Order matters:
 * Theme → Query → Auth → Toast.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
