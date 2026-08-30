import * as React from 'react'
import { logger } from '@/lib/logger'
import { ErrorState } from './error-state'

interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Optional fallback title shown when an error is caught. */
  title?: string
  /** Optional key used to reset the boundary (e.g. route path). */
  resetKey?: string | number | null
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Global / page-level error boundary. Prevents a single page error from
 * blanking the whole Admin. Backend stack traces are never shown.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Never log sensitive payloads here.
    logger.error('ErrorBoundary caught an error', { name: error.name })
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title={this.props.title ?? '页面发生错误'}
          error={this.state.error}
          onRetry={this.reset}
        />
      )
    }
    return this.props.children
  }
}
