import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ColumnDef, PaginationState, RowSelectionState, SortingState, VisibilityState } from '@tanstack/react-table'
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

  it('keeps the existing client pagination and totals when server mode is absent', async () => {
    const user = userEvent.setup()
    const clientRows = Array.from({ length: 12 }, (_, index) => ({
      id: String(index + 1),
      name: `Row ${String(index + 1).padStart(2, '0')}`,
    }))
    render(<DataTable columns={columns} data={clientRows} />)

    expect(screen.getByText('1-10 / 共 12 条')).toBeInTheDocument()
    expect(screen.queryByText('Row 11')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '下一页' }))
    expect(screen.getByText('11-12 / 共 12 条')).toBeInTheDocument()
    expect(screen.getByText('Row 11')).toBeInTheDocument()
  })

  it('opts into controlled server pagination without repaginating the returned page', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()
    const pagination: PaginationState = { pageIndex: 1, pageSize: 2 }
    render(
      <DataTable
        columns={columns}
        data={data}
        server={{
          pagination,
          sorting: [],
          rowCount: 7,
          pageCount: 4,
          onPaginationChange,
          onSortingChange: vi.fn(),
        }}
      />,
    )

    expect(screen.getByText('3-5 / 共 7 条')).toBeInTheDocument()
    expect(screen.getByText('第 2 / 4 页')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '下一页' }))
    expect(onPaginationChange).toHaveBeenCalledTimes(1)
    const updater = onPaginationChange.mock.calls[0]?.[0] as (current: PaginationState) => PaginationState
    expect(updater(pagination)).toEqual({ pageIndex: 2, pageSize: 2 })
  })

  it('delegates sorting changes in server mode and does not reorder the supplied page locally', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    const sorting: SortingState = [{ id: 'name', desc: true }]
    render(
      <DataTable
        columns={columns}
        data={data}
        server={{
          pagination: { pageIndex: 0, pageSize: 50 },
          sorting,
          rowCount: 3,
          pageCount: 1,
          onPaginationChange: vi.fn(),
          onSortingChange,
        }}
      />,
    )

    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Alpha')
    await user.click(screen.getByRole('button', { name: '切换 名称 排序' }))
    expect(onSortingChange).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Alpha')
  })

  it('supports controlled column visibility without changing the uncontrolled default', async () => {
    const user = userEvent.setup()
    const onColumnVisibilityChange = vi.fn()
    const visibility: VisibilityState = { name: false }
    const view = render(
      <DataTable
        columns={columns}
        data={data}
        columnVisibility={visibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />,
    )

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    view.rerender(
      <DataTable
        columns={columns}
        data={data}
        columnVisibility={{ name: true }}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: '列' }))
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'name' }))
    expect(onColumnVisibilityChange).toHaveBeenCalledTimes(1)
  })

  it('does not offer selection and action columns that explicitly disable hiding', async () => {
    const user = userEvent.setup()
    const protectedColumns: ColumnDef<DemoRow>[] = [
      { id: 'select', header: '选择', cell: () => '选择', enableHiding: false },
      ...columns,
      { id: 'actions', header: '操作', cell: () => <button>编辑</button>, enableHiding: false },
    ]
    render(<DataTable columns={protectedColumns} data={data} />)

    await user.click(screen.getByRole('button', { name: '列' }))
    expect(await screen.findByRole('menuitemcheckbox', { name: 'name' })).toBeEnabled()
    expect(screen.queryByRole('menuitemcheckbox', { name: '选择' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitemcheckbox', { name: '操作' })).not.toBeInTheDocument()
  })

  it('exposes controlled page-local selection with an indeterminate header state', async () => {
    const user = userEvent.setup()
    const onRowSelectionChange = vi.fn()
    const onSelectedRowIdsChange = vi.fn()
    const controlledSelectionProps = {
      rowSelection: { '10000000-0000-4000-8000-000000000001': true },
      onRowSelectionChange,
      onSelectedRowIdsChange,
    }
    const selectableColumns: ColumnDef<DemoRow>[] = [{
      id: 'select',
      header: ({ table }) => <button
        aria-label="选择本页"
        aria-checked={table.getIsAllPageRowsSelected() ? 'true' : table.getIsSomePageRowsSelected() ? 'mixed' : 'false'}
        onClick={() => table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())}
        role="checkbox"
      />,
      cell: ({ row }) => <button aria-label={`选择 ${row.original.id}`} aria-checked={row.getIsSelected()} onClick={() => row.toggleSelected()} role="checkbox" />,
    }, ...columns]
    render(
      <DataTable
        columns={selectableColumns}
        data={data}
        {...controlledSelectionProps}
        enableRowSelection
        getRowId={(row) => `10000000-0000-4000-8000-${row.id.padStart(12, '0')}`}
      />,
    )

    expect(screen.getByRole('checkbox', { name: '选择本页' })).toHaveAttribute('aria-checked', 'mixed')
    await user.click(screen.getByRole('checkbox', { name: '选择本页' }))
    expect(onRowSelectionChange).toHaveBeenCalledTimes(1)
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith([
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003',
    ])
  })

  it('uses stable getRowId values instead of page-relative row indexes', async () => {
    const user = userEvent.setup()
    const onRowSelectionChange = vi.fn()
    const controlledSelectionProps = { rowSelection: {}, onRowSelectionChange }
    const selectableColumns: ColumnDef<DemoRow>[] = [{
      id: 'select',
      header: '选择',
      cell: ({ row }) => <button aria-label={`选择 ${row.original.name}`} onClick={() => row.toggleSelected()} />,
    }, ...columns]
    const stableId = '10000000-0000-4000-8000-000000000003'
    render(
      <DataTable
        columns={selectableColumns}
        data={[{ id: stableId, name: 'Gamma' }]}
        {...controlledSelectionProps}
        enableRowSelection
        getRowId={(row) => row.id}
      />,
    )
    await user.click(screen.getByRole('button', { name: '选择 Gamma' }))
    const updater = onRowSelectionChange.mock.calls[0]?.[0] as (current: RowSelectionState) => RowSelectionState
    expect(updater({})).toEqual({ [stableId]: true })
  })
})
