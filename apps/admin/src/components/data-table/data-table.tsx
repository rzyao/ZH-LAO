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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  /** Extra content rendered above the table, left of the view options. */
  toolbar?: React.ReactNode
  showViewOptions?: boolean
  showPagination?: boolean
  pageSizeOptions?: number[]
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: TData) => void
  getRowId?: (row: TData) => string
  enableRowSelection?: boolean
  initialSorting?: SortingState
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
  showViewOptions = true,
  showPagination = true,
  pageSizeOptions,
  emptyTitle = '暂无数据',
  emptyDescription,
  onRowClick,
  getRowId,
  enableRowSelection = false,
  initialSorting,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting ?? [])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection,
  })

  const columnCount = table.getVisibleLeafColumns().length
  const rows = table.getRowModel().rows

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">{toolbar}</div>
        {showViewOptions ? <DataTableViewOptions table={table} /> : null}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption className="sr-only">数据列表</TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} scope="col" colSpan={header.colSpan}>
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
                  className={onRowClick ? 'cursor-pointer' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      ) : null}
    </div>
  )
}
