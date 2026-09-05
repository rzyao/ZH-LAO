import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from '@tanstack/react-router'
import { Plus, RotateCcw } from 'lucide-react'
import { useAuth } from '@/auth/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table/data-table'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusBadge, type StatusTone } from '@/components/common/status-badge'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useToastApi } from '@/components/feedback/use-toast'
import { CONTENT_CATEGORY_CONFIGS, normalizeLaoLetterSearch, type ContentCategoryConfig, type LaoLetterSearch, type ManagedStructuredContent, type StructuredContentType } from '../structured/contracts'
import { useCreateStructuredContent, useDeriveStructuredContent, usePublishStructuredContent, useReEditStructuredContent, useReplaceDictionarySection, useReviewStructuredContent, useStructuredContentHistory, useStructuredContentList, useStructuredContentReferences, useSubmitStructuredContent, useUpdateStructuredContent } from '../structured/queries'

export interface ContentCategoryPageProps {
  contentType: StructuredContentType
  laoLetterSearch?: LaoLetterSearch
}

const statusLabels: Record<string, string> = { draft: '草稿', pending_review: '待审核', approved: '已批准', published: '已发布', rejected: '已驳回', superseded: '历史版本' }
const statusTones: Record<string, StatusTone> = { draft: 'muted', pending_review: 'warning', approved: 'info', published: 'success', rejected: 'danger', superseded: 'muted' }

export function ContentCategoryPage({ contentType, laoLetterSearch }: ContentCategoryPageProps) {
  const config = CONTENT_CATEGORY_CONFIGS[contentType]
  const navigate = useNavigate()
  const query = useStructuredContentList(config)
  const { permissions } = useAuth()
  const canWrite = permissions.includes(`content.${config.permissionResource}.write`)
  const canReview = permissions.includes(`content.${config.permissionResource}.review`)
  const canPublish = permissions.includes(`content.${config.permissionResource}.publish`)
  const createMutation = useCreateStructuredContent(config)
  const updateMutation = useUpdateStructuredContent(config)
  const submitMutation = useSubmitStructuredContent(config)
  const reviewMutation = useReviewStructuredContent(config)
  const reEditMutation = useReEditStructuredContent(config)
  const publishMutation = usePublishStructuredContent(config)
  const deriveMutation = useDeriveStructuredContent(config)
  const dictionaryMutation = useReplaceDictionarySection(config)
  const toast = useToastApi()
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ManagedStructuredContent | null>(null)
  const [rejecting, setRejecting] = React.useState<ManagedStructuredContent | null>(null)
  const [publishing, setPublishing] = React.useState<ManagedStructuredContent | null>(null)
  const [rejectRemark, setRejectRemark] = React.useState('')
  const [inspecting, setInspecting] = React.useState<ManagedStructuredContent | null>(null)
  const [dictionarying, setDictionarying] = React.useState<ManagedStructuredContent | null>(null)
  const [search, setSearch] = React.useState(laoLetterSearch?.q ?? '')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const isLaoLetterPage = contentType === 'lo_letter' && laoLetterSearch !== undefined
  const updateLaoLetterSearch = React.useCallback((patch: Partial<LaoLetterSearch>) => {
    if (!laoLetterSearch) return
    const next = normalizeLaoLetterSearch({ ...laoLetterSearch, ...patch, page: 1 })
    void navigate({ to: '/content/lo/letters', search: next, replace: true })
  }, [laoLetterSearch, navigate])

  React.useEffect(() => {
    if (!isLaoLetterPage) return
    setSearch(laoLetterSearch?.q ?? '')
  }, [isLaoLetterPage, laoLetterSearch?.q])

  React.useEffect(() => {
    if (!isLaoLetterPage || search === (laoLetterSearch?.q ?? '')) return
    const timer = window.setTimeout(() => updateLaoLetterSearch({ q: search }), 300)
    return () => window.clearTimeout(timer)
  }, [isLaoLetterPage, laoLetterSearch, search, updateLaoLetterSearch])
  const fail = React.useCallback((error: unknown) => toast.error({ title: `${config.categoryLabel}操作失败`, description: error instanceof Error ? error.message : '请稍后重试' }), [config.categoryLabel, toast])
  const failPublish = React.useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : '请稍后重试'
    if (message.includes('may already be committed')) {
      toast.error({ title: '发布状态待确认', description: `${message} 正在刷新版本状态。` })
      void query.refetch()
      return
    }
    fail(error)
  }, [fail, query, toast])

  const columns = React.useMemo<ColumnDef<ManagedStructuredContent>[]>(() => [
    { id: 'content', header: '内容', cell: ({ row }) => <span className="font-medium">{displayValue(config, row.original)}</span> },
    { accessorKey: 'revisionNumber', header: '版本', cell: ({ row }) => row.original.revisionNumber ? `第 ${row.original.revisionNumber} 版` : '—' },
    { accessorKey: 'revisionStatus', header: '版本状态', cell: ({ row }) => { const status = row.original.revisionStatus ?? 'draft'; return <StatusBadge tone={statusTones[status] ?? 'muted'} label={statusLabels[status] ?? status} /> } },
    { id: 'composition', header: '组成项', cell: ({ row }) => row.original.snapshot?.composition?.length ?? 0 },
    { id: 'actions', header: '操作', cell: ({ row }) => <ContentRowActions row={row.original} canWrite={canWrite} canReview={canReview} canPublish={canPublish} onInspect={() => setInspecting(row.original)} onEdit={() => { setEditing(row.original); setEditorOpen(true) }} onDictionary={() => setDictionarying(row.original)} onReject={() => { setRejectRemark(''); setRejecting(row.original) }} onSubmit={() => row.original.revisionId && submitMutation.mutate({ contentId: row.original.id, revisionId: row.original.revisionId }, { onSuccess: () => toast.success({ title: '已提交审核' }), onError: fail })} onApprove={() => row.original.revisionId && reviewMutation.mutate({ contentId: row.original.id, revisionId: row.original.revisionId, action: 'approve' }, { onSuccess: () => toast.success({ title: '审核已批准' }), onError: fail })} onReEdit={() => row.original.revisionId && reEditMutation.mutate({ contentId: row.original.id, revisionId: row.original.revisionId }, { onSuccess: () => toast.success({ title: '已退回草稿编辑状态' }), onError: fail })} onPublish={() => setPublishing(row.original)} onDerive={() => deriveMutation.mutate(row.original.id, { onSuccess: () => toast.success({ title: '已从正式版本创建新草稿' }), onError: fail })} /> },
  ], [canPublish, canReview, canWrite, config, deriveMutation, fail, reEditMutation, reviewMutation, submitMutation, toast])

  const submitEditor = (snapshot: Record<string, unknown>) => {
    if (editing?.revisionId && editing.lockVersion !== null) {
      updateMutation.mutate({ contentId: editing.id, revisionId: editing.revisionId, snapshot, expectedLockVersion: editing.lockVersion }, { onSuccess: () => { setEditorOpen(false); setEditing(null); toast.success({ title: '草稿已保存' }) }, onError: fail })
    } else {
      createMutation.mutate(snapshot, { onSuccess: () => { setEditorOpen(false); toast.success({ title: '草稿已创建' }) }, onError: fail })
    }
  }
  const filteredItems = (query.data?.items ?? []).filter((item) => {
    const matchesSearch = !search.trim() || displayValue(config, item).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    const matchesStatus = statusFilter === 'all' || item.revisionStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return <ListPageLayout title={`${config.categoryLabel}管理`} description={config.description} breadcrumb={[{ label: '内容管理' }, { label: `${config.languageLabel}内容` }, { label: `${config.categoryLabel}管理` }]} actions={<Button disabled={!canWrite} onClick={() => { setEditing(null); setEditorOpen(true) }}><Plus aria-hidden />新建{config.categoryLabel}</Button>}>
    <div className="p-4" data-testid={config.testId}>
      <p className="mb-3 text-xs text-muted-foreground">权限按当前类别独立校验；保存草稿不会影响已发布版本。</p>
      <DataTable columns={columns} data={filteredItems} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => row.id} showPagination={!isLaoLetterPage} toolbar={<div className="flex flex-wrap gap-2"><Input aria-label={`搜索${config.categoryLabel}`} className="max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`搜索${config.categoryLabel}`} />{isLaoLetterPage ? <LaoLetterQueryControls search={laoLetterSearch} onChange={updateLaoLetterSearch} /> : <select aria-label="筛选版本状态" className="h-9 rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">全部状态</option><option value="draft">草稿</option><option value="pending_review">待审核</option><option value="approved">已批准</option><option value="published">已发布</option><option value="rejected">已驳回</option></select>}</div>} emptyTitle={`暂无${config.categoryLabel}内容`} emptyDescription={`点击“新建${config.categoryLabel}”创建第一份草稿。`} />
    </div>
    <ContentEditorDialog config={config} open={editorOpen} row={editing} pending={createMutation.isPending || updateMutation.isPending} onOpenChange={setEditorOpen} onSubmit={submitEditor} />
    <DictionarySectionsDialog row={dictionarying} pending={dictionaryMutation.isPending} onOpenChange={(open) => !open && setDictionarying(null)} onSave={async (sections) => {
      if (!dictionarying || dictionarying.lockVersion === null) return
      let lockVersion = dictionarying.lockVersion
      for (const [section, value] of Object.entries(sections) as Array<['meanings' | 'examples' | 'relationships' | 'tags', unknown]>) {
        const result = await dictionaryMutation.mutateAsync({ contentId: dictionarying.id, section, body: { expectedLockVersion: lockVersion, [section === 'relationships' ? 'equivalents' : section]: value, ...(section === 'relationships' && value && typeof value === 'object' ? value as Record<string, unknown> : {}) } }) as { lockVersion?: number }
        if (typeof result.lockVersion !== 'number') throw new Error('词典分区保存未返回版本锁')
        lockVersion = result.lockVersion
      }
      setDictionarying(null); toast.success({ title: '词典资料已保存到当前草稿' })
    }} />
    <VersionReferenceDialog config={config} row={inspecting} onOpenChange={(open) => !open && setInspecting(null)} />
    <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}><DialogContent><DialogHeader><DialogTitle>驳回此版本</DialogTitle><DialogDescription>请说明需要修改的内容，原因将写入版本记录。</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="content-reject-remark">驳回原因</Label><Input id="content-reject-remark" value={rejectRemark} onChange={(event) => setRejectRemark(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setRejecting(null)}>取消</Button><Button variant="destructive" disabled={!rejectRemark.trim() || reviewMutation.isPending} onClick={() => rejecting?.revisionId && reviewMutation.mutate({ contentId: rejecting.id, revisionId: rejecting.revisionId, action: 'reject', remark: rejectRemark }, { onSuccess: () => { setRejecting(null); toast.success({ title: '版本已驳回' }) }, onError: fail })}>确认驳回</Button></DialogFooter></DialogContent></Dialog>
    <ConfirmDialog open={Boolean(publishing)} onOpenChange={(open) => !open && setPublishing(null)} title={`确认发布${publishing ? `“${displayValue(config, publishing)}”` : ''}？`} description="系统将再次检查语言边界、组成顺序和所有下级依赖；通过后立即切换正式版本。" confirmLabel="确认发布" loading={publishMutation.isPending} onConfirm={() => publishing?.revisionId && publishMutation.mutate({ contentId: publishing.id, revisionId: publishing.revisionId }, { onSuccess: () => { setPublishing(null); toast.success({ title: '内容已正式发布' }) }, onError: failPublish })} />
  </ListPageLayout>
}

const laoLetterTypeLabels: Readonly<Record<string, string>> = {
  consonant: '辅音', vowel: '元音', tone_mark: '声调符号', other: '其他标记',
}

function LaoLetterQueryControls({ search, onChange }: {
  search: LaoLetterSearch
  onChange: (patch: Partial<LaoLetterSearch>) => void
}) {
  const selectedTypes = search.letter_type.join(',')
  const selectedTypeLabel = search.letter_type.length === 0
    ? '全部字母类型'
    : search.letter_type.map((value) => laoLetterTypeLabels[value]).join('、')
  return <>
    <select aria-label="字母类型" className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedTypes} onChange={(event) => onChange({ letter_type: event.target.value ? [event.target.value as LaoLetterSearch['letter_type'][number]] : [] })}>
      <option value="">全部字母类型</option>
      {search.letter_type.length > 1 ? <option value={selectedTypes}>{selectedTypeLabel}</option> : null}
      <option value="consonant">辅音</option><option value="vowel">元音</option><option value="tone_mark">声调符号</option><option value="other">其他标记</option>
    </select>
    <select aria-label="字母类别" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.letter_class[0] ?? ''} onChange={(event) => onChange({ letter_class: event.target.value ? [event.target.value as LaoLetterSearch['letter_class'][number]] : [] })}>
      <option value="">全部字母类别</option><option value="cons_low">低辅音</option><option value="cons_middle">中辅音</option><option value="cons_high">高辅音</option>
    </select>
    <select aria-label="内容状态" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.content_status[0] ?? ''} onChange={(event) => onChange({ content_status: event.target.value ? [event.target.value as LaoLetterSearch['content_status'][number]] : [] })}>
      <option value="">全部内容状态</option><option value="active">启用</option><option value="disabled">停用</option><option value="archived">归档</option>
    </select>
    <select aria-label="工作修订状态" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.revision_status[0] ?? ''} onChange={(event) => onChange({ revision_status: event.target.value ? [event.target.value as LaoLetterSearch['revision_status'][number]] : [] })}>
      <option value="">全部修订状态</option><option value="draft">草稿</option><option value="pending_review">待审核</option><option value="approved">已批准</option><option value="rejected">已驳回</option><option value="none">无工作修订</option>
    </select>
    <select aria-label="排序字段" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.sort} onChange={(event) => onChange({ sort: event.target.value as LaoLetterSearch['sort'] })}>
      <option value="sort_order">排序号</option><option value="character">字符</option><option value="name">名称</option><option value="romanization">罗马化</option><option value="updated_at">更新时间</option>
    </select>
    <select aria-label="排序方向" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.order} onChange={(event) => onChange({ order: event.target.value as LaoLetterSearch['order'] })}>
      <option value="asc">升序</option><option value="desc">降序</option>
    </select>
    <select aria-label="每页条数" className="h-9 rounded-md border bg-background px-3 text-sm" value={search.page_size} onChange={(event) => onChange({ page_size: Number(event.target.value) })}>
      <option value={50}>50</option><option value={100}>100</option><option value={200}>200</option><option value={500}>500</option>
    </select>
  </>
}

function ContentRowActions({ row, canWrite, canReview, canPublish, onInspect, onEdit, onDictionary, onReject, onSubmit, onApprove, onReEdit, onPublish, onDerive }: { row: ManagedStructuredContent; canWrite: boolean; canReview: boolean; canPublish: boolean; onInspect: () => void; onEdit: () => void; onDictionary: () => void; onReject: () => void; onSubmit: () => void; onApprove: () => void; onReEdit: () => void; onPublish: () => void; onDerive: () => void }) {
  const isWord = row.contentType === 'zh_word' || row.contentType === 'lo_word'
  return <div className="flex flex-wrap gap-1"><Button size="sm" variant="ghost" onClick={onInspect}>版本与引用</Button><Button size="sm" variant="outline" disabled={!canWrite || row.revisionStatus !== 'draft'} onClick={onEdit}>编辑</Button>{isWord ? <Button size="sm" variant="outline" disabled={!canWrite || row.revisionStatus !== 'draft'} onClick={onDictionary}>词典资料</Button> : null}<Button size="sm" variant="outline" disabled={!canWrite || row.revisionStatus !== 'draft'} onClick={onSubmit}>提交审核</Button><Button size="sm" variant="outline" disabled={!canReview || row.revisionStatus !== 'pending_review'} onClick={onApprove}>批准</Button><Button size="sm" variant="outline" disabled={!canReview || row.revisionStatus !== 'pending_review'} onClick={onReject}>驳回</Button>{row.revisionStatus === 'rejected' ? <Button size="sm" variant="outline" disabled={!canWrite} onClick={onReEdit}>重新编辑</Button> : null}<Button size="sm" disabled={!canPublish || row.revisionStatus !== 'approved'} onClick={onPublish}>发布</Button><Button size="sm" variant="ghost" disabled={!canWrite || row.revisionStatus !== 'published'} onClick={onDerive}><RotateCcw aria-hidden />新版本</Button></div>
}

function ContentEditorDialog({ config, open, row, pending, onOpenChange, onSubmit }: { config: ContentCategoryConfig; open: boolean; row: ManagedStructuredContent | null; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (snapshot: Record<string, unknown>) => void }) {
  const dependencyConfig = config.dependencyType ? CONTENT_CATEGORY_CONFIGS[config.dependencyType] : null
  const dependencyQuery = useStructuredContentList(dependencyConfig ?? config)
  const [fields, setFields] = React.useState<Record<string, string | number>>({})
  const [composition, setComposition] = React.useState<string[]>([])
  const [selectedDependency, setSelectedDependency] = React.useState('')
  React.useEffect(() => {
    if (!open) return
    setFields(Object.fromEntries(config.fields.map((field) => { const existing = row?.snapshot?.fields[field.key]; return [field.key, typeof existing === 'string' || typeof existing === 'number' ? existing : field.defaultValue ?? ''] })))
    setComposition([...(row?.snapshot?.composition ?? [])].sort((a, b) => a.position - b.position).map((item) => item.contentId))
    setSelectedDependency('')
  }, [config, open, row])
  const publishedDependencies = dependencyConfig ? (dependencyQuery.data?.items ?? []).filter((item) => item.revisionStatus === 'published') : []
  const save = (event: React.FormEvent) => { event.preventDefault(); const normalized = Object.fromEntries(config.fields.map((field) => { const value = fields[field.key]; return [field.key, field.kind === 'number' ? (value === '' ? null : Number(value)) : value] })); onSubmit({ fields: normalized, composition: composition.map((contentId, index) => ({ contentId, position: index + 1 })), ...(row?.snapshot?.dictionary ? { dictionary: row.snapshot.dictionary } : {}) }) }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{row ? `编辑${config.categoryLabel}草稿` : `新建${config.categoryLabel}草稿`}</DialogTitle><DialogDescription>草稿可分步完善；提交审核前系统会检查组成顺序和下级正式版本。</DialogDescription></DialogHeader><form id="content-editor" className="space-y-3" onSubmit={save}><div className="grid gap-3 sm:grid-cols-2">{config.fields.map((field) => <div className="space-y-1.5" key={field.key}><Label htmlFor={`content-field-${field.key}`}>{field.label}</Label>{field.kind === 'select' ? <select id={`content-field-${field.key}`} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm" required={field.required} value={fields[field.key] ?? ''} onChange={(event) => setFields((current) => ({ ...current, [field.key]: event.target.value }))}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <Input id={`content-field-${field.key}`} type={field.kind === 'number' ? 'number' : 'text'} required={field.required} value={fields[field.key] ?? ''} onChange={(event) => setFields((current) => ({ ...current, [field.key]: event.target.value }))} />}</div>)}</div>{dependencyConfig ? <CompositionEditor label={config.dependencyLabel ?? '下级内容'} dependencyConfig={dependencyConfig} items={publishedDependencies} composition={composition} selected={selectedDependency} onSelect={setSelectedDependency} onAdd={() => { if (selectedDependency) setComposition((items) => [...items, selectedDependency]); setSelectedDependency('') }} onRemove={(index) => setComposition((items) => items.filter((_, itemIndex) => itemIndex !== index))} /> : null}</form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="content-editor" loading={pending}>保存草稿</Button></DialogFooter></DialogContent></Dialog>
}

function DictionarySectionsDialog({ row, pending, onOpenChange, onSave }: { row: ManagedStructuredContent | null; pending: boolean; onOpenChange: (open: boolean) => void; onSave: (sections: Record<'meanings' | 'examples' | 'relationships' | 'tags', unknown>) => Promise<void> }) {
  const [sections, setSections] = React.useState({ meanings: '[]', examples: '[]', relationships: '{\n  "equivalents": [],\n  "relations": []\n}', tags: '[]' })
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!row || !row.snapshot?.dictionary) return
    const dictionary = row.snapshot.dictionary
    setSections({
      meanings: JSON.stringify(dictionary.meanings, null, 2), examples: JSON.stringify(dictionary.examples, null, 2),
      relationships: JSON.stringify({ equivalents: dictionary.equivalents, relations: dictionary.relations }, null, 2), tags: JSON.stringify(dictionary.tags, null, 2),
    })
    setError(null)
  }, [row])
  const save = async () => {
    try {
      const parsed = Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, JSON.parse(value)])) as Record<'meanings' | 'examples' | 'relationships' | 'tags', unknown>
      const relationships = parsed.relationships
      if (!relationships || typeof relationships !== 'object' || Array.isArray(relationships) || !Array.isArray((relationships as Record<string, unknown>).equivalents) || !Array.isArray((relationships as Record<string, unknown>).relations)) throw new Error('关系必须包含 equivalents 和 relations 两个数组')
      validateDictionaryTargets(parsed)
      setError(null)
      await onSave(parsed)
    } catch (cause) { setError(cause instanceof Error ? cause.message : '词典资料格式无效') }
  }
  return <Dialog open={Boolean(row)} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>维护词典资料</DialogTitle><DialogDescription>所有释义、例句、对应、关系和标签均属于当前 Word 草稿；目标只填写公开 Content UUID，系统不会暴露内部编号。</DialogDescription></DialogHeader><div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">{(['meanings', 'examples', 'relationships', 'tags'] as const).map((section) => <div className="space-y-1.5" key={section}><Label htmlFor={`dictionary-${section}`}>{({ meanings: '释义', examples: '例句', relationships: '对应与关系', tags: '标签' })[section]}</Label><Textarea id={`dictionary-${section}`} className="min-h-36 font-mono text-xs" value={sections[section]} onChange={(event) => setSections((current) => ({ ...current, [section]: event.target.value }))} /></div>)}</div>{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button loading={pending} onClick={() => void save()}>保存词典资料</Button></DialogFooter></DialogContent></Dialog>
}

function validateDictionaryTargets(sections: Record<'meanings' | 'examples' | 'relationships' | 'tags', unknown>) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const assertTargets = (value: unknown, field: 'sentenceContentId' | 'targetContentId', label: string) => {
    if (!Array.isArray(value)) throw new Error(`${label}必须是数组`)
    for (const item of value) {
      if (!item || typeof item !== 'object' || !uuid.test(String((item as Record<string, unknown>)[field] ?? ''))) throw new Error(`${label}必须使用合法公开 Content UUID`)
    }
  }
  assertTargets(sections.examples, 'sentenceContentId', '例句目标')
  const relationships = sections.relationships as Record<string, unknown>
  assertTargets(relationships.equivalents, 'targetContentId', '对应目标')
  assertTargets(relationships.relations, 'targetContentId', '关系目标')
}

function CompositionEditor({ label, dependencyConfig, items, composition, selected, onSelect, onAdd, onRemove }: { label: string; dependencyConfig: ContentCategoryConfig; items: ManagedStructuredContent[]; composition: string[]; selected: string; onSelect: (value: string) => void; onAdd: () => void; onRemove: (index: number) => void }) {
  return <div className="space-y-2 rounded-lg border p-3"><Label htmlFor="content-dependency">{label}组成（按添加顺序排列）</Label><div className="flex gap-2"><select id="content-dependency" className="flex h-9 flex-1 rounded-md border bg-background px-3 text-sm" value={selected} onChange={(event) => onSelect(event.target.value)}><option value="">请选择已发布的{label}</option>{items.map((item) => <option key={item.id} value={item.id}>{displayValue(dependencyConfig, item)}</option>)}</select><Button type="button" variant="outline" disabled={!selected} onClick={onAdd}>添加</Button></div>{composition.length ? <ol className="space-y-1 text-sm">{composition.map((id, index) => { const item = items.find((candidate) => candidate.id === id); return <li className="flex items-center justify-between rounded bg-muted px-2 py-1" key={`${id}-${index}`}><span>{index + 1}. {item ? displayValue(dependencyConfig, item) : id}</span><Button type="button" size="sm" variant="ghost" onClick={() => onRemove(index)}>移除</Button></li> })}</ol> : <p className="text-xs text-muted-foreground">草稿可以暂不添加；提交审核前必须至少有一项。</p>}</div>
}

function VersionReferenceDialog({ config, row, onOpenChange }: { config: ContentCategoryConfig; row: ManagedStructuredContent | null; onOpenChange: (open: boolean) => void }) {
  const history = useStructuredContentHistory(config, row?.id ?? null)
  const references = useStructuredContentReferences(config, row?.id ?? null)
  const revisions = React.useMemo(() => history.data?.items ?? [], [history.data?.items])
  const [leftId, setLeftId] = React.useState('')
  const [rightId, setRightId] = React.useState('')
  React.useEffect(() => { if (revisions.length) { setLeftId(revisions[1]?.revisionId ?? revisions[0]?.revisionId ?? ''); setRightId(revisions[0]?.revisionId ?? '') } }, [revisions])
  const left = revisions.find((item) => item.revisionId === leftId)
  const right = revisions.find((item) => item.revisionId === rightId)
  return <Dialog open={Boolean(row)} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{row ? `${displayValue(config, row)}：版本与反向引用` : '版本与反向引用'}</DialogTitle><DialogDescription>比较任意两个不可变版本，并查看哪些上级内容正在引用当前内容。</DialogDescription></DialogHeader>
    <div className="space-y-4"><section className="space-y-2"><h3 className="font-medium">版本比较</h3>{history.isLoading ? <p className="text-sm text-muted-foreground">正在加载版本记录…</p> : revisions.length ? <><div className="grid gap-2 sm:grid-cols-2"><VersionSelect label="左侧版本" value={leftId} revisions={revisions} onChange={setLeftId} /><VersionSelect label="右侧版本" value={rightId} revisions={revisions} onChange={setRightId} /></div><div className="grid gap-2 sm:grid-cols-2"><VersionSnapshot config={config} revision={left} other={right} /><VersionSnapshot config={config} revision={right} other={left} /></div></> : <p className="text-sm text-muted-foreground">暂无版本记录。</p>}</section>
    <section className="space-y-2"><h3 className="font-medium">反向引用</h3>{references.isLoading ? <p className="text-sm text-muted-foreground">正在检查引用…</p> : references.data?.items.length ? <ul className="space-y-1 text-sm">{references.data.items.map((item, index) => <li className="rounded border px-3 py-2" key={`${item.contentId}-${index}`}>{CONTENT_CATEGORY_CONFIGS[item.contentType].categoryLabel} · {item.contentId}{item.position ? ` · 第 ${item.position} 位` : ''}</li>)}</ul> : <p className="text-sm text-muted-foreground">当前没有上级内容引用此项。</p>}</section></div>
    <DialogFooter><Button onClick={() => onOpenChange(false)}>关闭</Button></DialogFooter></DialogContent></Dialog>
}

function VersionSelect({ label, value, revisions, onChange }: { label: string; value: string; revisions: Array<{ revisionId: string; revisionNumber: number; status: string }>; onChange: (value: string) => void }) {
  return <div className="space-y-1"><Label>{label}</Label><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{revisions.map((item) => <option value={item.revisionId} key={item.revisionId}>第 {item.revisionNumber} 版 · {statusLabels[item.status] ?? item.status}</option>)}</select></div>
}

function VersionSnapshot({ config, revision, other }: { config: ContentCategoryConfig; revision: { revisionNumber: number; status: string; snapshot: { fields: Record<string, unknown>; composition: Array<unknown>; dictionary?: unknown }; reviewRemark: string | null } | undefined; other: { snapshot: { fields: Record<string, unknown>; composition: Array<unknown>; dictionary?: unknown } } | undefined }) {
  if (!revision) return <div className="rounded border p-3 text-sm text-muted-foreground">请选择版本。</div>
  const dictionary = revision.snapshot.dictionary as { meanings?: unknown[]; examples?: unknown[]; equivalents?: unknown[]; relations?: unknown[]; tags?: unknown[] } | undefined
  const dictionaryChanged = JSON.stringify(revision.snapshot.dictionary ?? null) !== JSON.stringify(other?.snapshot.dictionary ?? null)
  return <div className="space-y-2 rounded border p-3"><div className="flex items-center justify-between"><strong>第 {revision.revisionNumber} 版</strong><StatusBadge tone={statusTones[revision.status] ?? 'muted'} label={statusLabels[revision.status] ?? revision.status} /></div><dl className="space-y-1 text-sm">{config.fields.map((field) => { const value = revision.snapshot.fields[field.key]; const changed = JSON.stringify(value) !== JSON.stringify(other?.snapshot.fields[field.key]); return <div className={changed ? 'rounded bg-warning/10 px-2 py-1' : 'px-2 py-1'} key={field.key}><dt className="text-xs text-muted-foreground">{field.label}{changed ? '（有变化）' : ''}</dt><dd>{value === null || value === undefined || value === '' ? '—' : String(value)}</dd></div> })}<div className={revision.snapshot.composition.length !== other?.snapshot.composition.length ? 'rounded bg-warning/10 px-2 py-1' : 'px-2 py-1'}><dt className="text-xs text-muted-foreground">组成项数量</dt><dd>{revision.snapshot.composition.length}</dd></div>{dictionary ? <div className={dictionaryChanged ? 'rounded bg-warning/10 px-2 py-1' : 'px-2 py-1'}><dt className="text-xs text-muted-foreground">词典聚合{dictionaryChanged ? '（有变化）' : ''}</dt><dd>释义 {dictionary.meanings?.length ?? 0} · 例句 {dictionary.examples?.length ?? 0} · 对应 {dictionary.equivalents?.length ?? 0} · 关系 {dictionary.relations?.length ?? 0} · 标签 {dictionary.tags?.length ?? 0}</dd></div> : null}</dl>{revision.reviewRemark ? <p className="text-sm text-destructive">驳回原因：{revision.reviewRemark}</p> : null}</div>
}

function displayValue(config: ContentCategoryConfig, item: ManagedStructuredContent): string { const value = item.snapshot?.fields[config.displayField]; return typeof value === 'string' || typeof value === 'number' ? String(value) : item.id }

export function ContentReviewPage({ language }: { language: '中文' | '老挝语' }) {
  const types = language === '中文' ? ['zh_pinyin_element', 'zh_syllable', 'zh_hanzi', 'zh_word', 'zh_sentence'] as const : ['lo_letter', 'lo_syllable', 'lo_word', 'lo_sentence'] as const
  return <ListPageLayout title={`${language}审核发布`} description={`集中处理${language}各类别的待审核与待发布版本；发布失败会保留原状态并显示全部阻塞原因。`} breadcrumb={[{ label: '内容管理' }, { label: `${language}内容` }, { label: '审核发布' }]}><div className="space-y-3 p-4" data-testid={`content-${language === '中文' ? 'zh' : 'lo'}-review-page`}>{types.map((type) => <ReviewCategoryPanel key={type} config={CONTENT_CATEGORY_CONFIGS[type]} />)}</div></ListPageLayout>
}

function ReviewCategoryPanel({ config }: { config: ContentCategoryConfig }) {
  const query = useStructuredContentList(config)
  const review = useReviewStructuredContent(config)
  const publish = usePublishStructuredContent(config)
  const { permissions } = useAuth()
  const toast = useToastApi()
  const [inspecting, setInspecting] = React.useState<ManagedStructuredContent | null>(null)
  const [publishing, setPublishing] = React.useState<ManagedStructuredContent | null>(null)
  const [publishBlockers, setPublishBlockers] = React.useState<string[]>([])
  const canReview = permissions.includes(`content.${config.permissionResource}.review`)
  const canPublish = permissions.includes(`content.${config.permissionResource}.publish`)
  const items = (query.data?.items ?? []).filter((item) => item.revisionStatus === 'pending_review' || item.revisionStatus === 'approved')
  const fail = (error: unknown) => toast.error({ title: `${config.categoryLabel}操作失败`, description: error instanceof Error ? error.message : '请稍后重试' })
  const failPublish = (error: unknown) => {
    const message = error instanceof Error ? error.message : '发布预检失败，请稍后重试'
    if (message.includes('may already be committed')) {
      setPublishing(null)
      toast.error({ title: '发布状态待确认', description: `${message} 正在刷新版本状态。` })
      void query.refetch()
      return
    }
    setPublishBlockers([message])
    setPublishing(null)
    toast.error({ title: `${config.categoryLabel}发布被阻止`, description: message })
  }
  return <section className="rounded-lg border p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-medium">{config.categoryLabel}</h2><span className="text-xs text-muted-foreground">待处理 {items.length}</span></div>{publishBlockers.length ? <div aria-label="发布阻塞" className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" role="alert"><p className="font-medium text-destructive">发布阻塞</p><ul className="mt-1 list-disc space-y-1 pl-5">{publishBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul><Button className="mt-2" size="sm" variant="outline" onClick={() => setPublishBlockers([])}>已了解</Button></div> : null}{query.isLoading ? <p className="text-sm text-muted-foreground">正在加载…</p> : items.length ? <ul className="space-y-2">{items.map((item) => <li className="flex flex-wrap items-center justify-between gap-2 rounded bg-muted/50 px-3 py-2" key={item.id}><div><p className="font-medium">{displayValue(config, item)}</p><p className="text-xs text-muted-foreground">第 {item.revisionNumber} 版 · {statusLabels[item.revisionStatus ?? ''] ?? item.revisionStatus}</p></div><div className="flex flex-wrap gap-1"><Button size="sm" variant="ghost" onClick={() => setInspecting(item)}>查看版本差异</Button>{item.revisionStatus === 'pending_review' ? <><Button size="sm" variant="outline" disabled={!canReview || review.isPending} onClick={() => item.revisionId && review.mutate({ contentId: item.id, revisionId: item.revisionId, action: 'approve' }, { onSuccess: () => toast.success({ title: '审核已批准' }), onError: fail })}>批准</Button><Button size="sm" variant="outline" disabled={!canReview || review.isPending} onClick={() => { const remark = window.prompt('请输入驳回原因'); if (remark?.trim() && item.revisionId) review.mutate({ contentId: item.id, revisionId: item.revisionId, action: 'reject', remark }, { onSuccess: () => toast.success({ title: '版本已驳回' }), onError: fail }) }}>驳回</Button></> : <Button size="sm" disabled={!canPublish || publish.isPending} onClick={() => { setPublishBlockers([]); setPublishing(item) }}>执行发布预检并发布</Button>}</div></li>)}</ul> : <p className="text-sm text-muted-foreground">当前没有待审核或待发布版本。</p>}<VersionReferenceDialog config={config} row={inspecting} onOpenChange={(open) => !open && setInspecting(null)} /><ConfirmDialog open={Boolean(publishing)} onOpenChange={(open) => !open && setPublishing(null)} title={`确认发布${publishing ? `“${displayValue(config, publishing)}”` : ''}？`} description="发布前将重新检查全部结构依赖；若有阻塞，版本会保持原状态。" confirmLabel="确认发布" loading={publish.isPending} onConfirm={() => publishing?.revisionId && publish.mutate({ contentId: publishing.id, revisionId: publishing.revisionId }, { onSuccess: () => { setPublishing(null); toast.success({ title: '内容已正式发布' }) }, onError: failPublish })} /></section>
}
