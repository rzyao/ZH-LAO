import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';

import { AppText } from '../components/common/AppText';
import { createLogger } from '../utils/logger';

const log = createLogger('error-boundary');

export interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  /** Identifies the boundary in logs and tests. */
  readonly scope?: string;
  /** Custom fallback renderer. */
  readonly fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  readonly error: Error | null;
}

/**
 * App error boundary.
 *
 * Fatal render errors are contained and reported; no backend stack trace is
 * shown to the user.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    log.error('render error', {
      scope: this.props.scope ?? 'root',
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  override render(): React.ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <View style={styles.container} testID={`error-boundary-${this.props.scope ?? 'root'}`}>
        <TriangleAlert size={30} color="#FF3B30" />
        <AppText variant="h3" colorVariant="primary" bold center>
          应用出错了
        </AppText>
        <AppText variant="bodySmall" colorVariant="secondary" center>
          {error.message}
        </AppText>
        <AppText variant="caption" colorVariant="accent" medium onPress={this.reset} testID="error-boundary-reset">
          重试
        </AppText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
    backgroundColor: '#F7F8FA',
  },
});
