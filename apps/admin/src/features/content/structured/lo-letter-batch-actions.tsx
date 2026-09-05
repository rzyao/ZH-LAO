import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type LaoLetterBatchAction = 'submit_review' | 'approve' | 'reject' | 'publish' | 'archive'
export type LaoLetterBatchSubmitInput = Readonly<{
  action: LaoLetterBatchAction
  reason?: string
  idempotencyKey: string
}>

const labels: Readonly<Record<LaoLetterBatchAction, readonly [string, string]>> = {
  submit_review: ['批量提交审核', '确认提交审核'],
  approve: ['批量通过', '确认通过'],
  reject: ['批量驳回', '确认驳回'],
  publish: ['批量发布', '确认发布'],
  archive: ['批量归档', '确认归档'],
}

export function LaoLetterBatchActions({ actions, selection, onSubmit, onSelectionStale }: {
  actions: readonly LaoLetterBatchAction[]
  selection: Readonly<{ mode: 'page_ids'; contentIds: readonly string[] }>
    | Readonly<{ mode: 'query_all'; expectedCount: number; selectionHash: string }>
  onSubmit: (input: LaoLetterBatchSubmitInput) => Promise<void>
  onSelectionStale?: () => void
}) {
  const [active, setActive] = React.useState<LaoLetterBatchAction | null>(null)
  const [reason, setReason] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [retryInput, setRetryInput] = React.useState<LaoLetterBatchSubmitInput | null>(null)
  const [submissionError, setSubmissionError] = React.useState('')
  const count = selection.mode === 'query_all' ? selection.expectedCount : selection.contentIds.length
  const requiresReason = active === 'reject' || active === 'archive'

  const submit = async (input: LaoLetterBatchSubmitInput) => {
    setPending(true)
    try {
      await onSubmit(input)
      setActive(null)
      setReason('')
      setRetryInput(null)
    } catch (error) {
      if (error instanceof TypeError) setRetryInput(input)
      else {
        setSubmissionError(error instanceof Error ? error.message : '批量任务提交失败')
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'BATCH_SELECTION_CHANGED') {
          onSelectionStale?.()
        }
      }
    } finally {
      setPending(false)
    }
  }

  const confirm = () => {
    if (!active) return
    const normalizedReason = reason.trim()
    const input: LaoLetterBatchSubmitInput = {
      action: active,
      idempotencyKey: globalThis.crypto.randomUUID(),
      ...(requiresReason ? { reason: normalizedReason } : {}),
    }
    void submit(input)
  }

  return <>
    <div className="flex flex-wrap gap-2" aria-label="批量操作">
      {actions.map((action) => <Button key={action} size="sm" variant={action === 'archive' ? 'destructive' : 'outline'} onClick={() => { setActive(action); setReason(''); setRetryInput(null); setSubmissionError('') }}>{labels[action][0]}</Button>)}
    </div>
    <Dialog open={active !== null} onOpenChange={(open) => { if (!open && !pending) setActive(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{active ? labels[active][1] : '确认批量操作'}</DialogTitle>
          <DialogDescription>
            {selection.mode === 'query_all' ? '当前查询全部范围' : '当前页所选范围'}，共 {count} 项。任务创建后将逐项处理。
          </DialogDescription>
        </DialogHeader>
        {requiresReason ? <div className="space-y-2"><Label htmlFor="lo-letter-batch-reason">操作原因</Label><Input id="lo-letter-batch-reason" value={reason} onChange={(event) => setReason(event.target.value)} /></div> : null}
        {retryInput ? <p role="alert" className="text-sm text-destructive">提交结果未知，请使用同一请求标识重试。</p> : null}
        {submissionError ? <p role="alert" className="text-sm text-destructive">{submissionError}</p> : null}
        <DialogFooter>
          <Button disabled={pending} variant="outline" onClick={() => setActive(null)}>取消</Button>
          {retryInput ? <Button disabled={pending} onClick={() => { void submit(retryInput) }}>重试提交</Button> : <Button disabled={pending || (requiresReason && !reason.trim())} onClick={confirm}>{active ? labels[active][1] : '确认'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
}
