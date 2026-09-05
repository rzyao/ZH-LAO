import { useParams } from '@tanstack/react-router'
import * as React from 'react'
import { ErrorState } from '@/components/feedback/error-state'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CONTENT_CATEGORY_CONFIGS, type StructuredContentType } from '@/features/content/structured/contracts'
import { useStructuredContentHistory, useStructuredContentList } from '@/features/content/structured/queries'
import type { LessonSnapshot } from '../api'
import { RevisionHistory } from '../components/revision-history'
import { useDeriveLessonWorking, useLessonDetail, useLessonLifecycle, useReplaceLessonStructure } from '../queries'

type Section = LessonSnapshot['sections'][number]

const sectionTypes: Section['sectionType'][] = ['introduction', 'knowledge', 'example', 'practice', 'summary', 'custom']

export function LessonDetailPage() {
  const { lessonId } = useParams({ from: '/shell/content/lessons/$lessonId' })
  const query = useLessonDetail(lessonId)
  const lifecycle = useLessonLifecycle(lessonId)
  const derive = useDeriveLessonWorking(lessonId)
  const replace = useReplaceLessonStructure(lessonId)
  const [loadedRevision, setLoadedRevision] = React.useState<string | null>(null)
  const [sections, setSections] = React.useState<Section[]>([])
  const [sectionType, setSectionType] = React.useState<Section['sectionType']>('knowledge')
  const [sectionTitle, setSectionTitle] = React.useState('')
  const [contentType, setContentType] = React.useState<StructuredContentType>('zh_word')
  const [contentId, setContentId] = React.useState<string | null>(null)
  const [contentRevisionId, setContentRevisionId] = React.useState<string | null>(null)
  const [reviewing, setReviewing] = React.useState<string | null>(null)
  const [remark, setRemark] = React.useState('')
  const contentConfig = CONTENT_CATEGORY_CONFIGS[contentType]
  const contentList = useStructuredContentList(contentConfig)
  const contentHistory = useStructuredContentHistory(contentConfig, contentId)
  const snapshot = query.data?.workingSnapshot
  const workingRevisionId = query.data?.workingRevisionId
  React.useEffect(() => {
    if (!snapshot || !workingRevisionId || loadedRevision === workingRevisionId) return
    setLoadedRevision(workingRevisionId)
    setSections(snapshot.sections.map((section, index) => ({ ...section, sortOrder: index + 1 })))
  }, [loadedRevision, snapshot, workingRevisionId])
  if (query.isPending) return <ListPageLayout title="课节详情" description="正在读取课节版本…" breadcrumb={[{ label: '课程管理', href: '/content/courses' }, { label: '课节详情' }]}>{null}</ListPageLayout>
  if (query.error || !query.data) return <ErrorState title="无法读取课节" message="请稍后重试。" onRetry={() => void query.refetch()} />
  const lesson = query.data
  const addSection = () => {
    if (!sectionTitle.trim()) return
    setSections((current) => [...current, { sectionType, title: sectionTitle.trim(), sortOrder: current.length + 1, items: [] }])
    setSectionTitle('')
  }
  const addContentPin = (sectionIndex: number) => {
    const revision = contentHistory.data?.items.find((item) => item.revisionId === contentRevisionId && item.status === 'published')
    if (!contentId || !revision) return
    setSections((current) => current.map((section, index) => index !== sectionIndex ? section : { ...section, items: [...section.items, { itemType: 'content', entityId: contentId, revisionId: revision.revisionId, sortOrder: section.items.length + 1 }] }))
  }
  const save = () => {
    const revision = lesson.revisions.find((item) => item.id === lesson.workingRevisionId)
    if (!revision || !snapshot) return
    replace.mutate({ revisionId: revision.id, lockVersion: revision.lockVersion, updatedAt: lesson.updatedAt, snapshot: { sections } })
  }
  return <ListPageLayout title={lesson.title} description="课节工作版本仅保存固定的已发布 Content revision 引用。" breadcrumb={[{ label: '课程管理', href: '/content/courses' }, { label: '课节详情' }]}>
    {lifecycle.error || derive.error || replace.error ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">操作未完成，请刷新后重试。</p> : null}
    {lesson.status === 'published' && lesson.publishedRevisionId ? <div className="flex justify-end"><Button variant="outline" disabled={derive.isPending} onClick={() => derive.mutate({ revisionId: lesson.publishedRevisionId!, updatedAt: lesson.updatedAt })}>创建工作版本</Button></div> : null}
    {snapshot && lesson.workingRevisionId ? <section className="rounded-lg border bg-card p-6"><h2 className="text-base font-semibold">课节编排</h2><p className="mt-1 text-sm text-muted-foreground">章节只可固定引用已发布的 Content revision，后续发布不会改写本课节历史快照。</p><div className="mt-4 flex gap-2"><select aria-label="章节类型" className="h-9 rounded-md border bg-background px-3 text-sm" value={sectionType} onChange={(event) => setSectionType(event.target.value as Section['sectionType'])}>{sectionTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><Input aria-label="章节标题" placeholder="章节标题" value={sectionTitle} onChange={(event) => setSectionTitle(event.target.value)} /><Button variant="outline" disabled={!sectionTitle.trim()} onClick={addSection}>新增章节</Button></div><div className="mt-4 grid gap-2 rounded-md border p-3 sm:grid-cols-3"><select aria-label="内容类别" className="h-9 rounded-md border bg-background px-3 text-sm" value={contentType} onChange={(event) => { setContentType(event.target.value as StructuredContentType); setContentId(null); setContentRevisionId(null) }}>{Object.values(CONTENT_CATEGORY_CONFIGS).map((config) => <option key={config.contentType} value={config.contentType}>{config.languageLabel} · {config.categoryLabel}</option>)}</select><select aria-label="内容实体" className="h-9 rounded-md border bg-background px-3 text-sm" value={contentId ?? ''} onChange={(event) => { setContentId(event.target.value || null); setContentRevisionId(null) }}><option value="">选择内容实体</option>{contentList.data?.items.map((item) => <option key={item.id} value={item.id}>{String(item.snapshot?.fields[contentConfig.displayField] ?? item.id)}</option>)}</select><select aria-label="已发布内容版本" className="h-9 rounded-md border bg-background px-3 text-sm" value={contentRevisionId ?? ''} onChange={(event) => setContentRevisionId(event.target.value || null)} disabled={!contentId}><option value="">选择已发布版本</option>{contentHistory.data?.items.filter((item) => item.status === 'published').map((revision) => <option key={revision.revisionId} value={revision.revisionId}>版本 {revision.revisionNumber}</option>)}</select></div><ol className="mt-4 divide-y rounded-md border">{sections.map((section, index) => <li key={`${section.sortOrder}-${section.title ?? ''}`} className="px-4 py-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{section.sortOrder}. {section.title ?? section.sectionType}</p><p className="text-sm text-muted-foreground">{section.sectionType} · {section.items.length} 个固定引用</p>{section.items.map((item) => <p key={item.revisionId} className="mt-1 break-all text-xs text-muted-foreground">Content {item.entityId} · revision {item.revisionId}</p>)}</div><Button size="sm" variant="outline" disabled={!contentId || !contentRevisionId} onClick={() => addContentPin(index)}>加入已发布内容</Button></div></li>)}</ol><div className="mt-4 flex justify-end"><Button disabled={replace.isPending} onClick={save}>保存课节工作版本</Button></div></section> : null}
    <RevisionHistory revisions={lesson.revisions} onSubmit={(revisionId) => { const revision = lesson.revisions.find((item) => item.id === revisionId); if (revision) lifecycle.mutate({ revisionId, lockVersion: revision.lockVersion, command: 'submit' }) }} onReview={setReviewing} onPublish={(revisionId) => { const revision = lesson.revisions.find((item) => item.id === revisionId); if (revision) lifecycle.mutate({ revisionId, lockVersion: revision.lockVersion, command: 'publish' }) }} />
    <Dialog open={Boolean(reviewing)} onOpenChange={(open) => { if (!open) { setReviewing(null); setRemark('') } }}><DialogContent><DialogHeader><DialogTitle>审核课节版本</DialogTitle><DialogDescription>通过后可发布；驳回必须说明需要修改的原因。</DialogDescription></DialogHeader><div className="space-y-2"><label className="text-sm font-medium" htmlFor="lesson-review-remark">驳回原因</label><Input id="lesson-review-remark" value={remark} onChange={(event) => setRemark(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setReviewing(null)}>取消</Button><Button variant="destructive" disabled={!remark.trim() || lifecycle.isPending} onClick={() => { const revision = lesson.revisions.find((item) => item.id === reviewing); if (revision) lifecycle.mutate({ revisionId: revision.id, lockVersion: revision.lockVersion, command: 'reject', remark }, { onSuccess: () => setReviewing(null) }) }}>驳回</Button><Button disabled={lifecycle.isPending} onClick={() => { const revision = lesson.revisions.find((item) => item.id === reviewing); if (revision) lifecycle.mutate({ revisionId: revision.id, lockVersion: revision.lockVersion, command: 'approve' }, { onSuccess: () => setReviewing(null) }) }}>通过审核</Button></DialogFooter></DialogContent></Dialog>
  </ListPageLayout>
}
