import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type CourseRevisionSummary = Readonly<{
  id: string
  number: number
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'superseded'
  createdAt: string
}>

const statusLabel: Record<CourseRevisionSummary['status'], string> = {
  draft: '草稿', pending_review: '待审核', approved: '已批准', published: '已发布', rejected: '已驳回', superseded: '已替代',
}

export function RevisionHistory({ revisions, onSubmit, onReview, onPublish }: Readonly<{
  revisions: readonly CourseRevisionSummary[]
  onSubmit?: (revisionId: string) => void
  onReview?: (revisionId: string) => void
  onPublish?: (revisionId: string) => void
}>) {
  return (
    <section aria-labelledby="course-revision-history" className="rounded-lg border bg-card">
      <header className="border-b px-6 py-4">
        <h2 id="course-revision-history" className="text-base font-semibold text-foreground">版本历史</h2>
        <p className="mt-1 text-sm text-muted-foreground">历史版本不可修改；发布新内容必须从工作版本完成审核。</p>
      </header>
      <ul className="divide-y">
        {revisions.map((revision) => (
          <li key={revision.id} className="flex items-center justify-between gap-4 px-6 py-4">
            <div><p className="font-medium text-foreground">版本 {revision.number}</p><p className="text-sm text-muted-foreground">{new Date(revision.createdAt).toLocaleString('zh-CN')}</p></div>
            <div className="flex items-center gap-2">
              <Badge variant={revision.status === 'published' ? 'default' : revision.status === 'rejected' ? 'destructive' : 'secondary'}>{statusLabel[revision.status]}</Badge>
              {revision.status === 'draft' && onSubmit ? <Button size="sm" onClick={() => onSubmit(revision.id)}>提交审核</Button> : null}
              {revision.status === 'pending_review' && onReview ? <Button size="sm" onClick={() => onReview(revision.id)}>审核</Button> : null}
              {revision.status === 'approved' && onPublish ? <Button size="sm" onClick={() => onPublish(revision.id)}>发布</Button> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
