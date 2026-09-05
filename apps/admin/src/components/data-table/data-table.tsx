import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableLoading } from '@/components/feedback/loading'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { DataTablePagination } from './data-table-pagination'
import { DataTableViewOptions } from './data-table-view-options'
import { cn } from '@/lib/utils'

export interface DataTableServerOptions {
  pagination: PaginationState
  sorting: SortingState
  rowCount: number
  pageCount: number
  onPaginationChange: OnChangeFn<PaginationState>
  onSortingChange: OnChangeFn<SortingState>
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  /** Extra content rendered above the table, left of the view options. */
  toolbar?: React.ReactNode
  /** Optional actions rendered immediately before the column-view control. */
  toolbarActions?: React.ReactNode
  showViewOptions?: boolean
  showPagination?: boolean
  pageSizeOptions?: number[]
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: TData) => void
  /** Optional page-specific hover treatment for body rows. */
  rowHoverClassName?: string
  /** Optional state treatment for sticky cells, such as a fixed action column. */
  stickyCellStateClassName?: string
  getRowId?: (row: TData) => string
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  onSelectedRowIdsChange?: (contentIds: readonly string[]) => void
  initialSorting?: SortingState
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  initialColumnVisibility?: VisibilityState
  server?: DataTableServerOptions
  className?: string
}

/**
 * Generic DataTable foundation based on TanStack Table v8.
 *
 * Supports sorting, selection, column visibility, pagination, and the
 * loading / empty / error states out of the box. Data is client-side here so
 * the Foundation is fully self-contained; Domain phases can layer server-side
 * contracts on top without changing this contract.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  error,
  onRetry,
  toolbar,
  toolbarActions,
  showViewOptions = true,
  showPagination = true,
  pageSizeOptions,
  emptyTitle = '暂无数据',
  emptyDescription,
  onRowClick,
  rowHoverClassName,
  stickyCellStateClassName,
  getRowId,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  onSelectedRowIdsChange,
  initialSorting,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  initialColumnVisibility,
  server,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting ?? [])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility ?? {})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const currentRowSelection = controlledRowSelection ?? rowSelection
  const handleRowSelectionChange = React.useCallback<OnChangeFn<RowSelectionState>>((updater) => {
    const next = typeof updater === 'function' ? updater(currentRowSelection) : updater
    ;(onRowSelectionChange ?? setRowSelection)(updater)
    onSelectedRowIdsChange?.(
      Object.entries(next)
        .filter(([, selected]) => selected)
        .map(([contentId]) => contentId),
    )
  }, [currentRowSelection, onRowSelectionChange, onSelectedRowIdsChange])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: server?.sorting ?? sorting,
      columnVisibility: controlledColumnVisibility ?? columnVisibility,
      rowSelection: currentRowSelection,
      pagination: server?.pagination ?? pagination,
    },
    onSortingChange: server?.onSortingChange ?? setSorting,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    onPaginationChange: server?.onPaginationChange ?? setPagination,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection,
    manualPagination: Boolean(server),
    manualSorting: Boolean(server),
    ...(server ? { rowCount: server.rowCount, pageCount: server.pageCount } : {}),
  })

  const columnCount = table.getVisibleLeafColumns().length
  const rows = table.getRowModel().rows

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">{toolbar}</div>
        <div className="flex shrink-0 items-center gap-2">
          {toolbarActions}
          {showViewOptions ? <DataTableViewOptions table={table} /> : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border" data-testid="data-table-scroll-container">
        <Table>
          <TableCaption className="sr-only">数据列表</TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} scope="col" colSpan={header.colSpan} className={stickyColumnClass(header.column.columnDef.meta, true)}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          {loading ? (
            <TableLoading rows={5} columns={Math.max(columnCount, 1)} />
          ) : error ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={Math.max(columnCount, 1)} className="p-0">
                  <ErrorState error={error} onRetry={onRetry} className="min-h-0 border-0 bg-transparent py-10" />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : rows.length ? (
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn('group', rowHoverClassName, onRowClick ? 'cursor-pointer' : undefined)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn(stickyColumnClass(cell.column.columnDef.meta, false), stickyCellStateClassName)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={Math.max(columnCount, 1)} className="p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    className="min-h-0 border-0 bg-transparent py-10"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </div>

      {showPagination ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          totalRows={server?.rowCount}
          currentPageRowCount={server ? rows.length : undefined}
        />
      ) : null}
    </div>
  )
}

function stickyColumnClass(meta: unknown, header: boolean): string | undefined {
  const sticky = (meta as { sticky?: 'left' | 'right' } | undefined)?.sticky
  if (!sticky) return undefined
  return cn(
    'sticky z-20 focus-within:outline-none focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring',
    sticky === 'right' ? 'right-0' : 'left-0',
    header ? 'z-30 bg-secondary' : 'bg-background',
  )
}
