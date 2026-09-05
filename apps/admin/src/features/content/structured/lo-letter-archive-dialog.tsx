import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { laoLetterAdminApi } from './api'
import type { LaoLetterListItem } from './contracts'
import { laoLetterBatchTaskKeys, laoLetterQueryKeys } from './queries'

export function LaoLetterArchiveDialog({ row, onClose, onCreated, onError }: {
  row: LaoLetterListItem | null
  onClose: () => void
  onCreated: (taskId: string) => void
  onError: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  const [reason, setReason] = React.useState('')
  const archive = useMutation({
    mutationFn: () => {
      if (!row) throw new Error('未选择字母')
      return laoLetterAdminApi.startBatch({
        action: 'archive',
        idempotencyKey: globalThis.crypto.randomUUID(),
        reason: reason.trim(),
        selection: { mode: 'explicit_ids', content_ids: [row.content_id], expected_count: 1 },
      })
    },
    onSuccess: (task) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: laoLetterQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: laoLetterBatchTaskKeys.root }),
      ])
      setReason('')
      onCreated(task.task_id)
      onClose()
    },
    onError,
  })

  React.useEffect(() => { if (!row) setReason('') }, [row])

  return <Dialog open={row !== null} onOpenChange={(open) => { if (!open && !archive.isPending) onClose() }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>删除字母“{row?.character ?? ''}”</DialogTitle>
        <DialogDescription>删除会将记录归档，而非物理移除；系统会创建仅包含此字母的异步任务，并保留其审计与版本历史。</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2"><Label htmlFor="lo-letter-archive-reason">删除原因</Label><Input id="lo-letter-archive-reason" value={reason} onChange={(event) => setReason(event.target.value)} /></div>
      <DialogFooter><Button disabled={archive.isPending} variant="outline" onClick={onClose}>取消</Button><Button disabled={archive.isPending || !reason.trim()} variant="destructive" onClick={() => archive.mutate()}>{archive.isPending ? '正在创建任务…' : '确认删除'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
