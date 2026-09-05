import * as React from 'react'
import { DataTable } from '@/components/data-table/data-table'
import type { LaoLetterListData, LaoLetterListItem } from './contracts'
import { createLaoLetterColumns } from './lo-letter-columns'

export type LaoLetterPageState = Readonly<{
  kind: string
  data?: LaoLetterListData | Readonly<LaoLetterListData>
  querySummary?: string
  error?: Error
}>

export const LaoLetterPageView = React.memo(function LaoLetterPageView({
  state,
  onRetry,
  onClearFilters,
  server,
  columnVisibility,
  onColumnVisibilityChange,
  toolbar,
  toolbarActions,
  rowSelection,
  onRowSelectionChange,
  onSelectedRowIdsChange,
  onRowEdit,
  onRowArchive,
  rowHoverClassName,
  stickyCellStateClassName,
  className,
}: {
  state: LaoLetterPageState
  onRetry?: () => void
  onClearFilters?: () => void
  server?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['server']
  columnVisibility?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['columnVisibility']
  onColumnVisibilityChange?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['onColumnVisibilityChange']
  toolbar?: React.ReactNode
  toolbarActions?: React.ReactNode
  rowSelection?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['rowSelection']
  onRowSelectionChange?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['onRowSelectionChange']
  onSelectedRowIdsChange?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['onSelectedRowIdsChange']
  onRowEdit?: (row: LaoLetterListItem) => void
  onRowArchive?: (row: LaoLetterListItem) => void
  rowHoverClassName?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['rowHoverClassName']
  stickyCellStateClassName?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['stickyCellStateClassName']
  className?: React.ComponentProps<typeof DataTable<LaoLetterListItem, unknown>>['className']
}) {
  const columns = React.useMemo(() => createLaoLetterColumns(onRowEdit, onRowArchive), [onRowArchive, onRowEdit])
  const table = (
    <DataTable
      columns={columns}
      data={state.data ? [...state.data.items] : []}
      loading={state.kind === 'initial-loading'}
      error={state.kind === 'error' ? state.error : undefined}
      onRetry={onRetry}
      getRowId={(row) => row.content_id}
      enableRowSelection
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      pageSizeOptions={[50, 100, 200, 500]}
      showPagination={state.kind !== 'error' && state.kind !== 'initial-loading'}
      server={server}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={onColumnVisibilityChange}
      toolbar={toolbar}
      toolbarActions={toolbarActions}
      rowHoverClassName={rowHoverClassName}
      stickyCellStateClassName={stickyCellStateClassName}
      className={className}
      emptyTitle={state.kind === 'no-results' ? '没有匹配结果' : '暂无字母内容'}
      emptyDescription={state.kind === 'no-results'
        ? state.querySummary ? `当前条件：${state.querySummary}` : '请调整搜索或筛选条件。'
        : '当前还没有老挝语字母记录。'}
    />
  )

  if (state.kind === 'first-empty') return <div data-testid="lo-letter-first-empty">{table}</div>
  if (state.kind === 'no-results') {
    return <div data-testid="lo-letter-no-results">{table}<button className="mt-2 text-sm font-medium text-primary underline" onClick={onClearFilters}>清除筛选</button></div>
  }
  if (state.kind === 'error') return <div data-testid="lo-letter-error">{table}</div>
  return (
    <div data-testid={state.kind === 'initial-loading' ? 'lo-letter-initial-loading' : undefined}>
      {state.kind === 'background-refresh' ? <p aria-live="polite" className="mb-2 text-xs text-muted-foreground" data-testid="lo-letter-background-refresh" role="status">正在更新结果…</p> : null}
      {table}
    </div>
  )
})
