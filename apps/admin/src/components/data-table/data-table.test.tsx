import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table'
import { DataTableColumnHeader } from './data-table-column-header'

interface DemoRow {
  id: string
  name: string
}

const columns: ColumnDef<DemoRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="名称" />,
  },
]

const data: DemoRow[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
  { id: '3', name: 'Gamma' },
]

describe('DataTable foundation', () => {
  it('renders headers and rows', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute('scope', 'col')
    expect(screen.getByText('数据列表')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
  })

  it('shows loading rows while loading', () => {
    render(<DataTable columns={columns} data={[]} loading />)
    expect(screen.getByTestId('table-loading')).toBeInTheDocument()
  })

  it('shows the empty state for empty data', () => {
    render(<DataTable columns={columns} data={[]} emptyTitle="没有记录" />)
    expect(screen.getByText('没有记录')).toBeInTheDocument()
  })

  it('shows the error state on error and supports retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={[]}
        error={new Error('boom')}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('sorts rows when the sortable header is clicked', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={data} />)
    const headerButton = screen.getByRole('button', { name: '切换 名称 排序' })
    await user.click(headerButton)
    const rows = screen.getAllByRole('row')
    // Rows after header: sorted ascending by name -> Alpha, Beta, Gamma (unchanged order for this data)
    expect(rows[1]).toHaveTextContent('Alpha')
    await user.click(headerButton)
    const sortedRows = screen.getAllByRole('row')
    expect(sortedRows[1]).toHaveTextContent('Gamma')
  })
})
