import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { structuredContentApi } from './api'
import { CONTENT_CATEGORY_CONFIGS, type LaoLetterListItem, type StructuredRevisionItem } from './contracts'
import { laoLetterQueryKeys } from './queries'

const config = CONTENT_CATEGORY_CONFIGS.lo_letter

type EditorTarget = Readonly<{ mode: 'create' }> | Readonly<{ mode: 'edit'; row: LaoLetterListItem }>
type Draft = Readonly<{ revisionId: string; lockVersion: number; fields: Record<string, unknown> }>

export function LaoLetterEditorDialog({ target, onClose, onError, onSaved }: {
  target: EditorTarget | null
  onClose: () => void
  onError: (error: unknown) => void
  onSaved: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [fields, setFields] = React.useState<Record<string, string>>({})
  const [reopenedContentId, setReopenedContentId] = React.useState<string | null>(null)
  const open = target !== null
  const editingContentId = target?.mode === 'edit' ? target.row.content_id : null
  const history = useQuery({
    queryKey: ['content-admin', 'lo-letter-editor', editingContentId],
    queryFn: ({ signal }) => structuredContentApi.history(config, editingContentId!, signal),
    enabled: editingContentId !== null,
  })
  const derive = useMutation({
    mutationFn: (contentId: string) => structuredContentApi.derive(config, contentId) as Promise<{ revisionId: string }>,
  })
  const save = useMutation({
    mutationFn: async () => {
      const snapshot = { fields: normalizeFields(fields), composition: [] }
      if (target?.mode === 'create') return structuredContentApi.create(config, snapshot)
      if (target?.mode !== 'edit') throw new Error('未选择可编辑的字母')
      if (!draft) throw new Error('字母草稿尚未加载完成')
      return structuredContentApi.update(config, target.row.content_id, draft.revisionId, snapshot, draft.lockVersion)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: laoLetterQueryKeys.root })
      onSaved(target?.mode === 'create' ? '字母草稿已创建' : '字母草稿已保存')
      onClose()
    },
    onError,
  })

  React.useEffect(() => {
    if (!target) {
      setDraft(null)
      setReopenedContentId(null)
      return
    }
    if (target.mode === 'create') {
      setDraft(null)
      setReopenedContentId(null)
      setFields(defaultFields())
      return
    }
    const revision = history.data?.items.find((item) => item.revisionId === target.row.working_revision_id)
    if (!revision) return
    setDraft(toDraft(revision))
    setFields(toFormFields(revision.snapshot.fields))
  }, [history.data, target])

  const deriveDraft = React.useCallback(async () => {
    if (target?.mode !== 'edit') return
    try {
      const result = await derive.mutateAsync(target.row.content_id)
      const refreshed = await queryClient.fetchQuery({
        queryKey: ['content-admin', 'lo-letter-editor', target.row.content_id],
        queryFn: ({ signal }) => structuredContentApi.history(config, target.row.content_id, signal),
      })
      const revision = refreshed.items.find((item) => item.revisionId === result.revisionId)
      if (!revision) throw new Error('新工作草稿未出现在版本历史中')
      setDraft(toDraft(revision))
      setFields(toFormFields(revision.snapshot.fields))
      void queryClient.invalidateQueries({ queryKey: laoLetterQueryKeys.root })
    } catch (error) {
      onError(error)
    }
  }, [derive, onError, queryClient, target])

  const isEditable = target?.mode === 'create' || target?.row.working_revision_status === 'draft' || reopenedContentId === editingContentId
  const needsReEdit = target?.mode === 'edit' && target.row.working_revision_status === 'rejected' && reopenedContentId !== editingContentId
  const needsDerive = target?.mode === 'edit' && !target.row.working_revision_id

  return <Dialog open={open} onOpenChange={(next) => { if (!next && !save.isPending) onClose() }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{target?.mode === 'create' ? '新建字母草稿' : '编辑字母草稿'}</DialogTitle>
        <DialogDescription>保存只会更新工作草稿；正式版本不会被原地修改。</DialogDescription>
      </DialogHeader>
      {history.isLoading && target?.mode === 'edit' ? <p className="text-sm text-muted-foreground">正在加载草稿…</p> : null}
      {needsDerive ? <DraftAction message="该字母没有工作草稿。请先从正式版本派生草稿后再编辑。" label="创建工作草稿" pending={derive.isPending} onClick={() => { void deriveDraft() }} /> : null}
      {needsReEdit ? <DraftAction message="该草稿已被驳回。请先恢复为可编辑草稿。" label="恢复编辑" pending={derive.isPending} onClick={() => {
        if (target?.mode !== 'edit' || !target.row.working_revision_id) return
        void structuredContentApi.reEdit(config, target.row.content_id, target.row.working_revision_id)
          .then(() => queryClient.invalidateQueries({ queryKey: laoLetterQueryKeys.root }))
          .then(() => queryClient.invalidateQueries({ queryKey: ['content-admin', 'lo-letter-editor', target.row.content_id] }))
          .then(() => setReopenedContentId(target.row.content_id))
          .catch(onError)
      }} /> : null}
      {isEditable && (target?.mode === 'create' || draft) ? <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
        <Field label="字符" value={fields.character ?? ''} onChange={(value) => setFields((current) => ({ ...current, character: value }))} required />
        <div className="grid gap-2"><Label htmlFor="lo-letter-type">字母类型</Label><select id="lo-letter-type" className="h-9 rounded-md border bg-background px-3 text-sm" value={fields.letterType ?? 'consonant'} onChange={(event) => setFields((current) => ({ ...current, letterType: event.target.value }))}><option value="consonant">辅音</option><option value="vowel">元音</option><option value="tone_mark">声调符号</option><option value="other">其他标记</option></select></div>
        <Field label="字母分类" value={fields.letterClass ?? ''} onChange={(value) => setFields((current) => ({ ...current, letterClass: value }))} />
        <Field label="名称" value={fields.name ?? ''} onChange={(value) => setFields((current) => ({ ...current, name: value }))} />
        <Field label="转写" value={fields.romanization ?? ''} onChange={(value) => setFields((current) => ({ ...current, romanization: value }))} />
        <Field label="排序号" value={fields.sortOrder ?? '0'} onChange={(value) => setFields((current) => ({ ...current, sortOrder: value }))} type="number" required />
        <DialogFooter><Button variant="outline" type="button" onClick={onClose}>取消</Button><Button disabled={save.isPending} type="submit">{save.isPending ? '正在保存…' : '保存草稿'}</Button></DialogFooter>
      </form> : null}
    </DialogContent>
  </Dialog>
}

function DraftAction({ message, label, pending, onClick }: { message: string; label: string; pending: boolean; onClick: () => void }) {
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">{message}</p><DialogFooter><Button disabled={pending} onClick={onClick}>{pending ? '正在处理…' : label}</Button></DialogFooter></div>
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: 'text' | 'number'; required?: boolean }) {
  const id = `lo-letter-${label}`
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} /></div>
}

function defaultFields() { return { character: '', letterType: 'consonant', letterClass: '', name: '', romanization: '', sortOrder: '0' } }
function toFormFields(fields: Record<string, unknown>) { return { character: stringValue(fields.character), letterType: stringValue(fields.letterType) || 'consonant', letterClass: stringValue(fields.letterClass), name: stringValue(fields.name), romanization: stringValue(fields.romanization), sortOrder: String(fields.sortOrder ?? 0) } }
function stringValue(value: unknown) { return typeof value === 'string' ? value : '' }
function normalizeFields(fields: Record<string, string>) { return { character: fields.character.trim(), letterType: fields.letterType, ...(fields.letterClass.trim() ? { letterClass: fields.letterClass.trim() } : {}), ...(fields.name.trim() ? { name: fields.name.trim() } : {}), ...(fields.romanization.trim() ? { romanization: fields.romanization.trim() } : {}), sortOrder: Number(fields.sortOrder) } }
function toDraft(item: StructuredRevisionItem): Draft { return { revisionId: item.revisionId, lockVersion: item.lockVersion, fields: item.snapshot.fields } }
