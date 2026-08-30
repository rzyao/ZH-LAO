import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState, EmptyStateAction } from './empty-state'

describe('EmptyState', () => {
  it('renders title, description and icon', () => {
    render(<EmptyState title="暂无数据" description="稍后再试" />)
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
    expect(screen.getByText('稍后再试')).toBeInTheDocument()
  })

  it('renders a primary action and triggers it', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <EmptyState
        title="暂无数据"
        action={<EmptyStateAction onClick={onAction}>新建</EmptyStateAction>}
      />,
    )
    await user.click(screen.getByRole('button', { name: '新建' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
