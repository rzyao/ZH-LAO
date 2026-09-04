import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('renders the label and dot for a success tone', () => {
    render(<StatusBadge tone="success" label="Published" />)
    expect(screen.getByText('Published')).toBeInTheDocument()
    // Color is never the only signal: a dot is present.
    expect(document.querySelector('span[aria-hidden]')).toBeInTheDocument()
  })

  it('renders without a dot when dot is disabled', () => {
    render(<StatusBadge tone="danger" label="Failed" dot={false} />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(document.querySelector('span[aria-hidden]')).not.toBeInTheDocument()
  })

  it('maps each tone to the correct badge variant class', () => {
    const { rerender } = render(<StatusBadge tone="success" label="x" />)
    expect(document.querySelector('span')?.className).toContain('text-success')
    rerender(<StatusBadge tone="warning" label="x" />)
    expect(document.querySelector('span')?.className).toContain('text-warning')
    rerender(<StatusBadge tone="muted" label="x" />)
    expect(document.querySelector('span')?.className).toContain('bg-muted')
  })
})
