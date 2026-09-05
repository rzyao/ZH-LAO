import * as React from 'react'
import { Button } from '@/components/ui/button'

type PanelTask = Readonly<{
  task_id: string
  status: 'queued' | 'running' | 'completed' | 'completed_with_issues' | 'failed'
  target_count: number
  processed_count: number
  succeeded_count: number
  failed_count: number
  skipped_count: number
  items: readonly Readonly<{ content_id: string; status: string; error_code: string | null }>[]
  page: number
  page_size: number
  total: number
}>

const terminal = new Set<PanelTask['status']>(['completed', 'completed_with_issues', 'failed'])
const statusLabels: Readonly<Record<PanelTask['status'], string>> = {
  queued: '等待处理', running: '处理中', completed: '已完成', completed_with_issues: '部分完成', failed: '处理失败',
}

export function LaoLetterBatchTaskPanel({ visible, taskId, loadTask, retryFailed, onTaskListInvalidated }: Readonly<{
  visible: boolean
  taskId: string
  loadTask: (taskId: string, page: number, pageSize: number, status?: string) => Promise<PanelTask>
  retryFailed: (taskId: string) => Promise<PanelTask>
  onTaskListInvalidated: () => void
}>) {
  const [task, setTask] = React.useState<PanelTask | null>(null)
  const [page, setPage] = React.useState(1)
  const [status, setStatus] = React.useState('')
  const [retrying, setRetrying] = React.useState(false)
  const [loadError, setLoadError] = React.useState('')
  const [retryError, setRetryError] = React.useState('')
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    if (!visible) return
    let cancelled = false
    let timer: number | undefined
    let inFlight = false
    const poll = async () => {
      if (cancelled || inFlight || document.visibilityState !== 'visible') return
      inFlight = true
      try {
        const next = await loadTask(taskId, page, 20, status || undefined)
        if (cancelled) return
        setTask(next)
        setLoadError('')
        if (terminal.has(next.status)) onTaskListInvalidated()
        else if (document.visibilityState === 'visible') timer = window.setTimeout(() => { void poll() }, 2_000)
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : '批量任务加载失败')
      } finally {
        inFlight = false
      }
    }
    const onVisibilityChange = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = undefined
      if (document.visibilityState === 'visible') void poll()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    void poll()
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [loadTask, onTaskListInvalidated, page, reloadToken, status, taskId, visible])

  if (!visible) return null
  if (!task) return <section aria-label="批量任务详情">{loadError
    ? <div role="alert"><p>{loadError}</p><Button size="sm" variant="outline" onClick={() => setReloadToken((value) => value + 1)}>重试加载任务</Button></div>
    : <p>正在加载批量任务…</p>}</section>
  const canRetry = task.failed_count > 0 && (task.status === 'completed_with_issues' || task.status === 'failed')
  return <section className="space-y-3 rounded-md border p-3" aria-label="批量任务详情">
    {loadError ? <div role="alert" className="text-sm text-destructive"><p>{loadError}</p><Button size="sm" variant="outline" onClick={() => setReloadToken((value) => value + 1)}>重试加载任务</Button></div> : null}
    {retryError ? <p role="alert" className="text-sm text-destructive">{retryError}</p> : null}
    <div aria-live="polite" role="status">
      <p className="font-medium">{statusLabels[task.status]}</p>
      <p className="text-sm">任务 {task.task_id} · 已处理 {task.processed_count}/{task.target_count} · 成功 {task.succeeded_count} · 失败 {task.failed_count} · 跳过 {task.skipped_count}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="lo-letter-result-status">结果状态</label>
      <select id="lo-letter-result-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
        <option value="">全部</option><option value="succeeded">成功</option><option value="failed">失败</option><option value="skipped">跳过</option>
      </select>
      <Button disabled={page <= 1} size="sm" variant="outline" onClick={() => setPage((value) => value - 1)}>上一页</Button>
      <Button disabled={page * 20 >= task.total} size="sm" variant="outline" onClick={() => setPage((value) => value + 1)}>下一页</Button>
      {canRetry ? <Button disabled={retrying} size="sm" onClick={() => {
        setRetrying(true)
        setRetryError('')
        void retryFailed(taskId)
          .then((next) => { setTask(next); setPage(1); setStatus(''); onTaskListInvalidated() })
          .catch((error: unknown) => setRetryError(error instanceof Error ? error.message : '失败项重试失败'))
          .finally(() => setRetrying(false))
      }}>仅重试失败项</Button> : null}
    </div>
    {task.items.length > 0 ? <ul>{task.items.map((item) => <li key={item.content_id}>{item.content_id} · {item.status}{item.error_code ? ` · ${item.error_code}` : ''}</li>)}</ul> : <p className="text-sm text-muted-foreground">当前筛选没有结果。</p>}
  </section>
}
