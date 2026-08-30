import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../errors'

/**
 * Create the app's single QueryClient with frozen defaults.
 *
 * - Queries: short stale time, no window-focus refetch, bounded retry that
 *   only retries retryable ApiErrors.
 * - Mutations: never auto-retry — the server is the final validation
 *   authority and duplicate writes must be prevented.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false
          if (error instanceof ApiError) return error.retryable
          return false
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/** App-wide singleton. Components must NOT create their own QueryClient. */
export const queryClient = createQueryClient()
