import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ManagedCourse } from '../api'
import { useCourseList } from '../queries'

const languageLabel = { zh: '中文', lo: '老挝语' } as const
const statusLabel: Record<ManagedCourse['status'], string> = { draft: '草稿', published: '已发布', archived: '已归档' }
const revisionLabel: Record<NonNullable<ManagedCourse['workingRevisionStatus']>, string> = { draft: '草稿', pending_review: '待审核', approved: '已批准', published: '已发布', rejected: '已驳回', superseded: '已替代' }

const columns: ColumnDef<ManagedCourse>[] = [
  { accessorKey: 'title', header: '课程', cell: ({ row }) => <span className="font-medium text-foreground">{row.original.title}</span> },
  { accessorKey: 'learningLanguage', header: '语言', cell: ({ row }) => languageLabel[row.original.learningLanguage] },
  { accessorKey: 'sortOrder', header: () => <span className="block text-right">排序</span>, cell: ({ row }) => <span className="block text-right tabular-nums">{row.original.sortOrder}</span> },
  { accessorKey: 'status', header: '课程状态', cell: ({ row }) => <Badge variant={row.original.status === 'published' ? 'default' : 'secondary'}>{statusLabel[row.original.status]}</Badge> },
  { id: 'revision', header: '工作版本', cell: ({ row }) => row.original.workingRevisionStatus ? <Badge variant={row.original.workingRevisionStatus === 'rejected' ? 'destructive' : 'secondary'}>{revisionLabel[row.original.workingRevisionStatus]}</Badge> : <span className="text-muted-foreground">无</span> },
  { id: 'actions', header: '操作', cell: ({ row }) => <Link className="text-sm font-medium text-primary hover:underline" to="/content/courses/$courseId" params={{ courseId: row.original.id }}>查看</Link> },
]

export function CourseListPage() {
  const navigate = useNavigate()
  const query = useCourseList()
  return (
    <ListPageLayout
      title="课程管理"
      description="创建和维护课程编排；发布后学习端只读取固定的已发布版本。"
      breadcrumb={[{ label: '内容管理', href: '/content' }, { label: '课程管理' }]}
      actions={<Button onClick={() => void navigate({ to: '/content/courses/new' })}><Plus aria-hidden />创建课程</Button>}
    >
      <DataTable
        columns={columns}
        data={[...(query.data ?? [])]}
        loading={query.isPending}
        error={query.error}
        onRetry={() => { void query.refetch() }}
        getRowId={(course) => course.id}
        emptyTitle="暂无课程"
        emptyDescription="创建第一门课程后，即可编排课节并提交审核。"
      />
    </ListPageLayout>
  )
}
