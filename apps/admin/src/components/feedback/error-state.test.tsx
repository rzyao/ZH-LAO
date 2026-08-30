import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState } from './error-state'
import { NetworkError, ServerError, ValidationError } from '@/api/errors'

describe('ErrorState', () => {
  it('shows a safe generic message for unknown errors', () => {
    render(<ErrorState error={new Error('internal detail')} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText(/internal detail/)).not.toBeInTheDocument()
  })

  it('shows the ApiError message and request id', () => {
    const error = new ServerError(500, {
      code: 'boom',
      message: '服务器内部错误',
      requestId: 'req-123',
    })
    render(<ErrorState error={error} />)
    expect(screen.getByText('服务器内部错误')).toBeInTheDocument()
    expect(screen.getByText(/req-123/)).toBeInTheDocument()
  })

  it('does not render backend stack traces', () => {
    const stack = new Error('boom')
    stack.stack = 'Error: boom\n    at fn (file.ts:1:1)'
    render(<ErrorState error={stack} />)
    expect(screen.queryByText(/file\.ts/)).not.toBeInTheDocument()
  })

  it('invokes retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState error={new NetworkError()} onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows validation message from ApiError', () => {
    const error = new ValidationError({
      code: 'validation_failed',
      message: '字段校验失败',
    })
    render(<ErrorState error={error} />)
    expect(screen.getByText('字段校验失败')).toBeInTheDocument()
  })
})
