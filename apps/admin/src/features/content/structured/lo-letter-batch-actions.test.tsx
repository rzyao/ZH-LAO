import type { ComponentType } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const modulePath = './lo-letter-batch-actions'
type BatchAction = 'submit_review' | 'approve' | 'reject' | 'publish' | 'archive'
type SubmitInput = Readonly<{
  action: BatchAction
  reason?: string
  idempotencyKey: string
}>
type BatchActionsModule = Readonly<{
  LaoLetterBatchActions: ComponentType<{
    actions: readonly BatchAction[]
    selection: Readonly<{ mode: 'query_all'; expectedCount: number; selectionHash: string }>
    onSubmit: (input: SubmitInput) => Promise<void>
  }>
}>
const loadModule = () => import(/* @vite-ignore */ modulePath) as Promise<BatchActionsModule>
const selection = { mode: 'query_all', expectedCount: 126, selectionHash: 'a'.repeat(64) } as const

const labels: Readonly<Record<BatchAction, readonly [string, string]>> = {
  submit_review: ['批量提交审核', '确认提交审核'],
  approve: ['批量通过', '确认通过'],
  reject: ['批量驳回', '确认驳回'],
  publish: ['批量发布', '确认发布'],
  archive: ['批量归档', '确认归档'],
}

describe('Lao-letter server-driven batch actions (TC-007)', () => {
  it('renders only server batch_actions and never invents online/offline controls', async () => {
    const { LaoLetterBatchActions } = await loadModule()
    render(<LaoLetterBatchActions actions={['approve', 'archive']} selection={selection} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: labels.approve[0] })).toBeVisible()
    expect(screen.getByRole('button', { name: labels.archive[0] })).toBeVisible()
    expect(screen.queryByRole('button', { name: labels.publish[0] })).not.toBeInTheDocument()
    expect(screen.queryByText(/上线|下线/u)).not.toBeInTheDocument()
  })

  it.each(Object.entries(labels) as Array<[BatchAction, readonly [string, string]]>)(
    'requires a second confirmation for %s',
    async (action, [openLabel, confirmLabel]) => {
      const user = userEvent.setup()
      const onSubmit = vi.fn(async () => undefined)
      const { LaoLetterBatchActions } = await loadModule()
      render(<LaoLetterBatchActions actions={[action]} selection={selection} onSubmit={onSubmit} />)
      await user.click(screen.getByRole('button', { name: openLabel }))
      expect(onSubmit).not.toHaveBeenCalled()
      expect(screen.getByRole('dialog')).toHaveTextContent('126')
      if (action === 'reject' || action === 'archive') {
        await user.type(screen.getByLabelText('操作原因'), '  内容状态已过期  ')
      }
      await user.click(screen.getByRole('button', { name: confirmLabel }))
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ action }))
    },
  )

  it.each(['reject', 'archive'] as const)('requires and trims the %s reason', async (action) => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async () => undefined)
    const { LaoLetterBatchActions } = await loadModule()
    render(<LaoLetterBatchActions actions={[action]} selection={selection} onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: labels[action][0] }))
    const confirm = screen.getByRole('button', { name: labels[action][1] })
    expect(confirm).toBeDisabled()
    await user.type(screen.getByLabelText('操作原因'), '   ')
    expect(confirm).toBeDisabled()
    await user.clear(screen.getByLabelText('操作原因'))
    await user.type(screen.getByLabelText('操作原因'), '  内容状态已过期  ')
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ reason: '内容状态已过期' }))
  })

  it('reuses one idempotency key when a transport-unknown submission is retried', async () => {
    const user = userEvent.setup()
    const attempts: SubmitInput[] = []
    const onSubmit = vi.fn(async (input: SubmitInput) => {
      attempts.push(input)
      if (attempts.length === 1) throw new TypeError('Failed to fetch')
    })
    const { LaoLetterBatchActions } = await loadModule()
    render(<LaoLetterBatchActions actions={['approve']} selection={selection} onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: labels.approve[0] }))
    await user.click(screen.getByRole('button', { name: labels.approve[1] }))
    await user.click(await screen.findByRole('button', { name: '重试提交' }))
    expect(attempts).toHaveLength(2)
    expect(attempts[0]!.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/u)
    expect(attempts[1]!.idempotencyKey).toBe(attempts[0]!.idempotencyKey)
  })
})
