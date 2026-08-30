import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../auth/context/AuthProvider';
import { ToastHost } from '../components/feedback/Toast';
import { I18nProvider } from '../i18n/I18nProvider';
import { RootNavigator } from '../navigation/RootNavigator';
import { queryClient } from '../api/query/queryClient';
import { ThemeProvider } from '../theme/ThemeProvider';

import { ErrorBoundary } from './ErrorBoundary';

export interface AppProvidersProps {
  readonly children?: React.ReactNode;
  /** Called when the navigation container is ready (tests / boot metrics). */
  readonly onNavigationReady?: () => void;
}

/**
 * The single provider tree.
 *
 * ```text
 * ErrorBoundary
 *   SafeAreaProvider
 *     ThemeProvider
 *       I18nProvider
 *         QueryClientProvider      (one QueryClient, created in api/query)
 *           AuthProvider
 *             ErrorBoundary        (navigation scope)
 *               Navigation
 *             ToastHost
 * ```
 *
 * No provider and no QueryClient is created anywhere else.
 */
export function AppProviders({ children, onNavigationReady }: AppProvidersProps) {
  return (
    <ErrorBoundary scope="root">
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <ErrorBoundary scope="navigation">
                  {children ?? <RootNavigator onReady={onNavigationReady} />}
                </ErrorBoundary>
                <ToastHost />
              </AuthProvider>
            </QueryClientProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
