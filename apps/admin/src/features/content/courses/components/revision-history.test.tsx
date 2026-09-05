import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RevisionHistory } from './revision-history'

describe('RevisionHistory', () => {
  it('shows lifecycle state, immutable published history, and the next legal action', () => {
    render(
      <RevisionHistory
        revisions={[
          { id: 'published-revision', number: 1, status: 'published', createdAt: '2026-09-05T00:00:00.000Z' },
          { id: 'working-revision', number: 2, status: 'draft', createdAt: '2026-09-05T01:00:00.000Z' },
        ]}
        onSubmit={vi.fn()}
        onReview={vi.fn()}
        onPublish={vi.fn()}
      />,
    )

    expect(screen.getByText('已发布')).toBeInTheDocument()
    expect(screen.getByText('草稿')).toBeInTheDocument()
    expect(screen.getByText(/历史版本不可修改/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交审核' })).toBeInTheDocument()
  })
})
