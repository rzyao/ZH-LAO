import type { ComponentType } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

type TaskStatus = 'queued' | 'running' | 'completed' | 'completed_with_issues' | 'failed'
type Task = Readonly<{
  task_id: string
  status: TaskStatus
  target_count: number
  processed_count: number
  succeeded_count: number
  failed_count: number
  skipped_count: number
  items: readonly Readonly<{ content_id: string; status: 'succeeded' | 'failed' | 'skipped'; error_code: string | null }>[]
  page: number
  page_size: number
  total: number
}>
type PanelProps = Readonly<{
  visible: boolean
  taskId: string
  loadTask: (taskId: string, page: number, pageSize: number, status?: string) => Promise<Task>
  retryFailed: (taskId: string) => Promise<Task>
  onTaskListInvalidated: () => void
}>
type PanelModule = Readonly<{ LaoLetterBatchTaskPanel: ComponentType<PanelProps> }>
const modulePath = './lo-letter-batch-task-panel'
const loadPanel = () => import(/* @vite-ignore */ modulePath) as Promise<PanelModule>
const taskId = '10000000-0000-4000-8000-000000000099'

function task(status: TaskStatus, patch: Partial<Task> = {}): Task {
  return {
    task_id: taskId,
    status,
    target_count: 3,
    processed_count: status === 'running' ? 1 : 3,
    succeeded_count: 1,
    failed_count: status === 'completed_with_issues' ? 1 : 0,
    skipped_count: status === 'completed_with_issues' ? 1 : 0,
    items: [],
    page: 1,
    page_size: 20,
    total: 3,
    ...patch,
  }
}

afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
})

describe('Lao-letter batch task observation and retry (TC-008/TC-009/TC-010)', () => {
  it('polls a visible queued/running task every 2 seconds', async () => {
    vi.useFakeTimers()
    const loadTask = vi.fn(async () => task('running'))
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={loadTask} retryFailed={vi.fn()} onTaskListInvalidated={vi.fn()} />)
    await vi.advanceTimersByTimeAsync(4_100)
    expect(loadTask.mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  it('pauses while hidden and resumes immediately when the page becomes visible', async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    const loadTask = vi.fn(async () => task('running'))
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={loadTask} retryFailed={vi.fn()} onTaskListInvalidated={vi.fn()} />)
    await vi.advanceTimersByTimeAsync(4_100)
    expect(loadTask).not.toHaveBeenCalled()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(loadTask).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2_100)
    expect(loadTask.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it.each(['completed', 'completed_with_issues', 'failed'] as const)('stops polling at terminal status %s', async (status) => {
    vi.useFakeTimers()
    const loadTask = vi.fn(async () => task(status))
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={loadTask} retryFailed={vi.fn()} onTaskListInvalidated={vi.fn()} />)
    await vi.advanceTimersByTimeAsync(6_100)
    expect(loadTask).toHaveBeenCalledTimes(1)
  })

  it('announces partial progress and mixed terminal counters through aria-live', async () => {
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={async () => task('completed_with_issues')} retryFailed={vi.fn()} onTaskListInvalidated={vi.fn()} />)
    expect(await screen.findByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('status')).toHaveTextContent(/成功 1.*失败 1.*跳过 1/u)
  })

  it('invalidates task history after a visible task changes status', async () => {
    const invalidate = vi.fn()
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={async () => task('completed')} retryFailed={vi.fn()} onTaskListInvalidated={invalidate} />)
    await screen.findByText(/已完成/u)
    expect(invalidate).toHaveBeenCalled()
  })

  it('pages item results and applies the server status filter', async () => {
    const user = userEvent.setup()
    const loadTask = vi.fn(async (_id: string, page: number, pageSize: number, status?: string) => task('completed_with_issues', {
      page,
      page_size: pageSize,
      items: status === 'failed' ? [{ content_id: taskId, status: 'failed', error_code: 'ILLEGAL_STATE_TRANSITION' }] : [],
      total: 41,
    }))
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={loadTask} retryFailed={vi.fn()} onTaskListInvalidated={vi.fn()} />)
    await user.selectOptions(await screen.findByRole('combobox', { name: '结果状态' }), 'failed')
    await user.click(screen.getByRole('button', { name: '下一页' }))
    expect(loadTask).toHaveBeenLastCalledWith(taskId, 2, 20, 'failed')
  })

  it('offers retry only for failed items and refreshes list/detail after success', async () => {
    const user = userEvent.setup()
    const retryFailed = vi.fn(async () => task('queued'))
    const invalidate = vi.fn()
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={async () => task('completed_with_issues')} retryFailed={retryFailed} onTaskListInvalidated={invalidate} />)
    await user.click(await screen.findByRole('button', { name: '仅重试失败项' }))
    expect(retryFailed).toHaveBeenCalledWith(taskId)
    expect(invalidate).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /重试成功|重试跳过/u })).not.toBeInTheDocument()
  })

  it('renders a recoverable task-load error and retries successfully', async () => {
    const user = userEvent.setup()
    const loadTask = vi.fn()
      .mockRejectedValueOnce(new Error('网络暂不可用'))
      .mockResolvedValueOnce(task('completed'))
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={loadTask} retryFailed={vi.fn()} onTaskListInvalidated={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('网络暂不可用')
    await user.click(screen.getByRole('button', { name: '重试加载任务' }))
    expect(await screen.findByText('已完成')).toBeInTheDocument()
  })

  it('reports failed-item retry errors without an unhandled rejection', async () => {
    const user = userEvent.setup()
    const { LaoLetterBatchTaskPanel } = await loadPanel()
    render(<LaoLetterBatchTaskPanel visible taskId={taskId} loadTask={async () => task('completed_with_issues')} retryFailed={async () => { throw new Error('重试暂不可用') }} onTaskListInvalidated={vi.fn()} />)
    await user.click(await screen.findByRole('button', { name: '仅重试失败项' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('重试暂不可用')
  })
})
