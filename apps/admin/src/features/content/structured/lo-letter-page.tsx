import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { OnChangeFn, PaginationState, RowSelectionState, SortingState, VisibilityState } from '@tanstack/react-table'
import { Plus, RotateCcw } from 'lucide-react'
import { useAuth } from '@/auth/context/AuthContext'
import { useToastApi } from '@/components/feedback/use-toast'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  normalizeLaoLetterSearch,
  type LaoLetterSearch,
  type LaoLetterSearchInput,
} from './contracts'
import { laoLetterBatchTaskKeys, laoLetterQueryKeys, useLaoLetterBatchStart, useLaoLetterList, useLaoLetterSelectionPreview } from './queries'
import { laoLetterAdminApi } from './api'
import { LaoLetterPageView, type LaoLetterPageState } from './lo-letter-table'
import { LAO_LETTER_HIDEABLE_COLUMN_IDS } from './lo-letter-columns'
import {
  clearLaoLetterColumnVisibility,
  readLaoLetterColumnVisibility,
  writeLaoLetterColumnVisibility,
} from './lo-letter-column-preferences'
import {
  createPageSelection,
  isCurrentPageFullySelected,
  NO_LAO_LETTER_SELECTION,
  selectionQueryKey,
  upgradeToQueryAll,
  type LaoLetterSelectionState,
} from './lo-letter-selection'
import { LaoLetterSelectionBanner } from './lo-letter-batch-bar'
import { LaoLetterBatchActions, type LaoLetterBatchAction } from './lo-letter-batch-actions'
import { LaoLetterBatchTaskPanel } from './lo-letter-batch-task-panel'
import { TableAudioPlaybackProvider } from './audio-playback-button'
import { LaoLetterEditorDialog } from './lo-letter-editor-dialog'
import { LaoLetterArchiveDialog } from './lo-letter-archive-dialog'

export { LaoLetterPageView } from './lo-letter-table'

const letterTypeLabels: Readonly<Record<string, string>> = {
  consonant: '辅音',
  vowel: '元音',
  tone_mark: '声调符号',
  other: '其他标记',
}
export function updateLaoLetterSearch(
  current: LaoLetterSearchInput,
  patch: Partial<LaoLetterSearchInput>,
): LaoLetterSearch {
  const onlyPageChanged = Object.keys(patch).every((key) => key === 'page')
  return normalizeLaoLetterSearch({
    ...current,
    ...patch,
    ...(!onlyPageChanged ? { page: 1 } : {}),
  })
}

export function nearestValidLaoLetterPage(input: {
  page: number
  pageSize: number
  total: number
  itemCount: number
}): number {
  if (input.total === 0) return 1
  if (input.itemCount > 0) return input.page
  return Math.max(1, Math.ceil(input.total / input.pageSize))
}

export function LaoLetterPage({ search }: { search: LaoLetterSearch }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { permissions } = useAuth()
  const toast = useToastApi()
  const query = useLaoLetterList(search)
  const previewSelection = useLaoLetterSelectionPreview()
  const batchStart = useLaoLetterBatchStart()
  const currentSelectionQueryKey = selectionQueryKey(search)
  const [searchText, setSearchText] = React.useState(search.q ?? '')
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() =>
    readLaoLetterColumnVisibility(window.localStorage, LAO_LETTER_HIDEABLE_COLUMN_IDS),
  )
  const [selectionSnapshot, setSelectionSnapshot] = React.useState<{
    queryKey: string
    state: LaoLetterSelectionState
    rowSelection: RowSelectionState
  }>(() => ({ queryKey: currentSelectionQueryKey, state: NO_LAO_LETTER_SELECTION, rowSelection: {} }))
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null)
  const [selectionNotice, setSelectionNotice] = React.useState('')
  const [rowActionFilter, setRowActionFilter] = React.useState<readonly LaoLetterBatchAction[] | null>(null)
  const [editorTarget, setEditorTarget] = React.useState<null | { mode: 'create' } | { mode: 'edit'; row: NonNullable<typeof query.data>['items'][number] }>(null)
  const [archiveTarget, setArchiveTarget] = React.useState<NonNullable<typeof query.data>['items'][number] | null>(null)
  const canWrite = permissions.includes('content.lo_letters.write')
  const activeSelection = selectionSnapshot.queryKey === currentSelectionQueryKey
    ? selectionSnapshot
    : { queryKey: currentSelectionQueryKey, state: NO_LAO_LETTER_SELECTION, rowSelection: {} }
  const actionableSelection = activeSelection.state.mode === 'none' ? null : activeSelection.state
  const allPageSelected = isCurrentPageFullySelected(
    activeSelection.state,
    query.data?.items.map((item) => item.content_id) ?? [],
    activeSelection.rowSelection,
  )
  const loadBatchTask = React.useCallback(async (taskId: string, page: number, pageSize: number, status?: string) => {
    const detail = await laoLetterAdminApi.getBatchTask(taskId, page, pageSize, status)
    return { ...detail.task, items: detail.items.map((item) => ({ content_id: item.content_id, status: item.status, error_code: item.error_code ?? null })), page: detail.page, page_size: detail.page_size, total: detail.total }
  }, [])
  const retryBatchTask = React.useCallback(async (taskId: string) => {
    const task = await laoLetterAdminApi.retryFailed(taskId)
    return { ...task, items: [], page: 1, page_size: 20, total: task.target_count }
  }, [])
  const invalidateBatchViews = React.useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: laoLetterQueryKeys.root }),
      queryClient.invalidateQueries({ queryKey: laoLetterBatchTaskKeys.root }),
    ])
  }, [queryClient])

  const replaceSearch = React.useCallback((patch: Partial<LaoLetterSearchInput>) => {
    const next = updateLaoLetterSearch(search, patch)
    void navigate({ to: '/content/lo/letters', search: next, replace: true })
  }, [navigate, search])
  const changeColumnVisibility = React.useCallback<OnChangeFn<VisibilityState>>((updater) => {
    setColumnVisibility((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeLaoLetterColumnVisibility(window.localStorage, next)
      return next
    })
  }, [])
  const restoreDefaultColumns = React.useCallback(() => {
    clearLaoLetterColumnVisibility(window.localStorage)
    setColumnVisibility({})
  }, [])
  const changeRowSelection = React.useCallback<OnChangeFn<RowSelectionState>>((updater) => {
    setRowActionFilter(null)
    setSelectionNotice('')
    setSelectionSnapshot((current) => {
      const rowSelection = current.queryKey === currentSelectionQueryKey ? current.rowSelection : {}
      return {
        queryKey: currentSelectionQueryKey,
        state: current.queryKey === currentSelectionQueryKey ? current.state : NO_LAO_LETTER_SELECTION,
        rowSelection: typeof updater === 'function' ? updater(rowSelection) : updater,
      }
    })
  }, [currentSelectionQueryKey])
  const changeSelectedIds = React.useCallback((contentIds: readonly string[]) => {
    setRowActionFilter(null)
    setSelectionSnapshot((current) => ({
      queryKey: currentSelectionQueryKey,
      rowSelection: current.queryKey === currentSelectionQueryKey ? current.rowSelection : {},
      state: createPageSelection(contentIds),
    }))
  }, [currentSelectionQueryKey])
  const upgradeSelection = React.useCallback(async () => {
    if (!allPageSelected) return
    const preview = await previewSelection.mutateAsync(search)
    setSelectionSnapshot((current) => ({
      queryKey: currentSelectionQueryKey,
      rowSelection: current.queryKey === currentSelectionQueryKey ? current.rowSelection : {},
      state: upgradeToQueryAll(
        current.queryKey === currentSelectionQueryKey ? current.state : NO_LAO_LETTER_SELECTION,
        { expectedCount: preview.expected_count, selectionHash: preview.selection_hash },
        true,
      ),
    }))
  }, [allPageSelected, currentSelectionQueryKey, previewSelection, search])
  const openRowEditor = React.useCallback((row: NonNullable<typeof query.data>['items'][number]) => {
    setEditorTarget({ mode: 'edit', row })
  }, [])
  const retryList = React.useCallback(() => { void query.refetch() }, [query.refetch])
  const clearFilters = React.useCallback(() => replaceSearch({
    q: undefined,
    letter_type: [],
    letter_class: [],
    content_status: [],
    revision_status: [],
    sort: 'sort_order',
    order: 'asc',
  }), [replaceSearch])

  React.useEffect(() => setSearchText(search.q ?? ''), [search.q])
  React.useEffect(() => {
    if (searchText === (search.q ?? '')) return
    const timer = window.setTimeout(() => replaceSearch({ q: searchText }), 300)
    return () => window.clearTimeout(timer)
  }, [replaceSearch, search.q, searchText])

  React.useEffect(() => {
    if (!query.data || query.data.items.length > 0 || search.page <= 1) return
    const page = nearestValidLaoLetterPage({
      page: search.page,
      pageSize: search.page_size,
      total: query.data.total,
      itemCount: query.data.items.length,
    })
    if (page !== search.page) replaceSearch({ page })
  }, [query.data, replaceSearch, search.page, search.page_size])

  const hasFilters = Boolean(search.q)
    || search.letter_type.length > 0
    || search.letter_class.length > 0
    || search.content_status.length > 0
    || search.revision_status.length > 0
  const state = React.useMemo<LaoLetterPageState>(() => query.isPending
    ? { kind: 'initial-loading' }
    : query.isError && !query.data
      ? { kind: 'error', error: query.error instanceof Error ? query.error : new Error('request failed') }
      : query.data?.total === 0
        ? hasFilters
          ? { kind: 'no-results', querySummary: describeSearch(search) }
          : { kind: 'first-empty' }
        : query.isFetching
          ? { kind: 'background-refresh', data: query.data }
          : { kind: 'ready', data: query.data }, [hasFilters, query.data, query.error, query.isError, query.isFetching, query.isPending, search])

  const sorting = React.useMemo<SortingState>(() => [{ id: search.sort, desc: search.order === 'desc' }], [search.order, search.sort])
  const total = query.data?.total ?? 0
  const server = React.useMemo(() => ({
    pagination: { pageIndex: search.page - 1, pageSize: search.page_size },
    sorting,
    rowCount: total,
    pageCount: Math.max(1, Math.ceil(total / search.page_size)),
    onPaginationChange: (updater: React.SetStateAction<PaginationState>) => {
      const current = { pageIndex: search.page - 1, pageSize: search.page_size }
      const next = typeof updater === 'function' ? updater(current) : updater
      replaceSearch(next.pageSize !== current.pageSize
        ? { page_size: next.pageSize }
        : { page: next.pageIndex + 1 })
    },
    onSortingChange: (updater: React.SetStateAction<SortingState>) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]
      if (first) replaceSearch({ sort: first.id as LaoLetterSearch['sort'], order: first.desc ? 'desc' : 'asc' })
    },
  }), [replaceSearch, search.order, search.page, search.page_size, search.sort, sorting, total])
  const visibleRowIds = React.useMemo(() => query.data?.items.map((item) => item.content_id) ?? [], [query.data?.items])
  const queryToolbar = React.useMemo(() => <LaoLetterQueryControls search={search} searchText={searchText} showPageSize={query.isPending || query.isError} onSearchTextChange={setSearchText} onChange={replaceSearch} />, [query.isError, query.isPending, replaceSearch, search, searchText])
  const columnReset = React.useMemo(() => <Button aria-label="恢复默认列" size="sm" variant="outline" onClick={restoreDefaultColumns}><RotateCcw aria-hidden />恢复默认列</Button>, [restoreDefaultColumns])

  return (
    <ListPageLayout
      title="字母管理"
      description="维护老挝语字母、声调符号及其他正字法标记。"
      actions={<Button disabled={!canWrite} onClick={() => setEditorTarget({ mode: 'create' })}><Plus aria-hidden />新建字母</Button>}
      toolbar={actionableSelection === null ? null : <section className="flex flex-wrap items-center gap-3" aria-label="批量操作栏">
        <LaoLetterSelectionBanner
          state={activeSelection.state}
          total={total}
          allPageSelected={allPageSelected}
          upgrading={previewSelection.isPending}
          onUpgrade={() => { void upgradeSelection() }}
          className="border-0 bg-transparent p-0"
        />
        <div className="hidden h-5 w-px bg-border sm:block" aria-hidden />
        {selectionNotice ? <p className="text-sm text-muted-foreground" role="alert">{selectionNotice}</p> : null}
        <LaoLetterBatchActions
          actions={rowActionFilter ?? query.data?.batch_actions ?? []}
          selection={actionableSelection}
          onSelectionStale={() => {
            setSelectionSnapshot({ queryKey: currentSelectionQueryKey, state: NO_LAO_LETTER_SELECTION, rowSelection: {} })
            setRowActionFilter(null)
            setSelectionNotice('目标集合已变化，请重新选择')
          }}
          onSubmit={({ action, idempotencyKey, reason }) => batchStart.mutateAsync({
            action,
            idempotencyKey,
            ...(reason === undefined ? {} : { reason }),
            selection: actionableSelection.mode === 'query_all'
              ? {
                  mode: 'query_all',
                  query: selectionQueryFromSearch(search),
                  expected_count: actionableSelection.expectedCount,
                  selection_hash: actionableSelection.selectionHash,
                }
              : {
                  mode: 'explicit_ids',
                  content_ids: actionableSelection.contentIds,
                  expected_count: actionableSelection.contentIds.length,
                },
          }).then((task) => {
            setActiveTaskId(task.task_id)
            setSelectionNotice('')
            setRowActionFilter(null)
            setSelectionSnapshot({ queryKey: currentSelectionQueryKey, state: NO_LAO_LETTER_SELECTION, rowSelection: {} })
          })}
        />
      </section>}
    >
      <div className="space-y-3" data-testid="content-lo-letters-page">
        <div className="space-y-3">
          {activeTaskId ? <LaoLetterBatchTaskPanel
            visible
            taskId={activeTaskId}
            loadTask={loadBatchTask}
            retryFailed={retryBatchTask}
            onTaskListInvalidated={invalidateBatchViews}
          /> : null}
          {/* CR-001: 历史任务仍由服务端保留；首页只在刚发起操作后展示当前任务详情。 */}
          <section className="rounded-lg border bg-card p-4 shadow-xs [&_thead_button]:text-sm [&_thead_button]:font-semibold [&_thead_th]:text-sm [&_thead_th]:font-semibold" aria-label="字母数据表">
          <TableAudioPlaybackProvider visibleRowIds={visibleRowIds}><LaoLetterPageView
            state={state}
            server={server}
            rowSelection={activeSelection.rowSelection}
            onRowSelectionChange={changeRowSelection}
            onSelectedRowIdsChange={changeSelectedIds}
            onRowEdit={openRowEditor}
            onRowArchive={setArchiveTarget}
            rowHoverClassName="hover:bg-primary/5"
            stickyCellStateClassName="group-hover:bg-primary/5 group-data-[state=selected]:bg-[var(--primary-light)] focus-within:ring-0"
            className="space-y-4"
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={changeColumnVisibility}
            onRetry={retryList}
            onClearFilters={clearFilters}
            toolbar={queryToolbar}
            toolbarActions={columnReset}
          /></TableAudioPlaybackProvider>
          </section>
        </div>
      </div>
      <LaoLetterEditorDialog target={editorTarget} onClose={() => setEditorTarget(null)} onSaved={(message) => toast.success({ title: message })} onError={(error) => toast.error({ title: '字母草稿操作失败', description: error instanceof Error ? error.message : '请稍后重试' })} />
      <LaoLetterArchiveDialog row={archiveTarget} onClose={() => setArchiveTarget(null)} onCreated={(taskId) => { setActiveTaskId(taskId); toast.success({ title: '归档任务已创建' }) }} onError={(error) => toast.error({ title: '归档任务创建失败', description: error instanceof Error ? error.message : '请稍后重试' })} />
    </ListPageLayout>
  )
}

function selectionQueryFromSearch(search: LaoLetterSearch) {
  return {
    ...(search.q === undefined ? {} : { q: search.q }),
    letter_type: search.letter_type,
    letter_class: search.letter_class,
    content_status: search.content_status,
    revision_status: search.revision_status,
    sort: search.sort,
    order: search.order,
  }
}

function LaoLetterQueryControls({ search, searchText, showPageSize, onSearchTextChange, onChange }: {
  search: LaoLetterSearch
  searchText: string
  showPageSize: boolean
  onSearchTextChange: (value: string) => void
  onChange: (patch: Partial<LaoLetterSearchInput>) => void
}) {
  const selectedTypes = search.letter_type.join(',')
  const selectedTypeLabel = search.letter_type.length === 0
    ? '全部字母类型'
    : search.letter_type.map((value) => letterTypeLabels[value]).join('、')
  return <div className="flex flex-wrap gap-2">
    <Input aria-label="搜索字母" className="max-w-xs" value={searchText} onChange={(event) => onSearchTextChange(event.target.value)} placeholder="搜索字母" />
    <select aria-label="字母类型" className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedTypes} onChange={(event) => onChange({ letter_type: event.target.value ? [event.target.value] : [] })}>
      <option value="">全部字母类型</option>{search.letter_type.length > 1 ? <option value={selectedTypes}>{selectedTypeLabel}</option> : null}<option value="consonant">辅音</option><option value="vowel">元音</option><option value="tone_mark">声调符号</option><option value="other">其他标记</option>
    </select>
    <select aria-label="字母类别" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.letter_class[0] ?? ''} onChange={(event) => onChange({ letter_class: event.target.value ? [event.target.value] : [] })}>
      <option value="">全部字母类别</option><option value="cons_low">低辅音</option><option value="cons_middle">中辅音</option><option value="cons_high">高辅音</option>
    </select>
    <select aria-label="内容状态" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.content_status[0] ?? ''} onChange={(event) => onChange({ content_status: event.target.value ? [event.target.value] : [] })}>
      <option value="">全部内容状态</option><option value="active">启用</option><option value="disabled">停用</option><option value="archived">归档</option>
    </select>
    <select aria-label="工作修订状态" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.revision_status[0] ?? ''} onChange={(event) => onChange({ revision_status: event.target.value ? [event.target.value] : [] })}>
      <option value="">全部修订状态</option><option value="draft">草稿</option><option value="pending_review">待审核</option><option value="approved">已批准</option><option value="rejected">已驳回</option><option value="none">无工作修订</option>
    </select>
    <select aria-label="排序字段" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.sort} onChange={(event) => onChange({ sort: event.target.value as LaoLetterSearch['sort'] })}>
      <option value="sort_order">排序号</option><option value="character">字符</option><option value="name">名称</option><option value="romanization">罗马化</option><option value="updated_at">更新时间</option>
    </select>
    <select aria-label="排序方向" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.order} onChange={(event) => onChange({ order: event.target.value as LaoLetterSearch['order'] })}>
      <option value="asc">升序</option><option value="desc">降序</option>
    </select>
    {showPageSize ? <select aria-label="每页条数" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.page_size} onChange={(event) => onChange({ page_size: Number(event.target.value) })}>
      <option value={50}>50</option><option value={100}>100</option><option value={200}>200</option><option value={500}>500</option>
    </select> : null}
  </div>
}

function describeSearch(search: LaoLetterSearch): string {
  const values = [
    search.q,
    ...search.letter_type.map((value) => letterTypeLabels[value] ?? value),
    ...search.letter_class,
    ...search.content_status,
    ...search.revision_status,
  ].filter(Boolean)
  return values.join(' · ')
}
