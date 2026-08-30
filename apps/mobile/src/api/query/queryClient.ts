import { QueryClient } from '@tanstack/react-query';

import { isAppError } from '../errors/errors';

/**
 * The single application QueryClient.
 *
 * V2 rules:
 * - exactly one QueryClient exists, created here and only here;
 * - screens never create a QueryClient;
 * - server state is never mirrored into a global client store.
 */

export const DEFAULT_STALE_TIME_MS = 60_000;
export const DEFAULT_GC_TIME_MS = 5 * 60_000;
export const DEFAULT_RETRY_COUNT = 2;
export const DEFAULT_RETRY_BASE_DELAY_MS = 500;
export const MAX_RETRY_DELAY_MS = 8_000;

/** Retry only failures that can plausibly succeed on a second attempt. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= DEFAULT_RETRY_COUNT) {
    return false;
  }
  if (!isAppError(error)) {
    // Unknown shapes are retried once to survive transient transport noise.
    return failureCount < 1;
  }
  return error.isRetryable;
}

export function retryDelay(failureCount: number): number {
  return Math.min(DEFAULT_RETRY_BASE_DELAY_MS * 2 ** failureCount, MAX_RETRY_DELAY_MS);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Foundation is online-first: no offline-first cache pretending to be
        // source of truth.
        networkMode: 'online',
      },
      mutations: {
        // Mutations are never retried automatically: duplicating a command is
        // worse than surfacing the failure to the user.
        retry: 0,
        networkMode: 'online',
      },
    },
  });
}

/**
 * The application-wide QueryClient singleton.
 * Imported by `AppProviders` only.
 */
export const queryClient = createQueryClient();
