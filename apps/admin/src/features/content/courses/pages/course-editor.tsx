import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateCourse } from '../queries'

export function CourseEditorPage() {
  const navigate = useNavigate()
  const create = useCreateCourse()
  const [title, setTitle] = React.useState('')
  const [language, setLanguage] = React.useState<'zh' | 'lo'>('zh')
  const [sortOrder, setSortOrder] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) { setError('请输入课程名称。'); return }
    setError(null)
    try {
      const created = await create.mutateAsync({ learningLanguage: language, snapshot: { title: title.trim(), sortOrder, units: [] } })
      void navigate({ to: '/content/courses/$courseId', params: { courseId: created.courseId } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '课程创建失败，请重试。')
    }
  }
  return (
    <ListPageLayout title="创建课程" description="先创建课程草稿；课节编排完成后再提交审核。" breadcrumb={[{ label: '内容管理', href: '/content' }, { label: '课程管理', href: '/content/courses' }, { label: '创建课程' }]}>
      <form className="max-w-2xl space-y-6 rounded-lg border bg-card p-6" onSubmit={(event) => { void save(event) }}>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="course-title">课程名称 <span className="text-destructive">*</span></label><Input id="course-title" value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={Boolean(error)} /></div>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="course-language">学习语言 <span className="text-destructive">*</span></label><select id="course-language" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={language} onChange={(event) => setLanguage(event.target.value as 'zh' | 'lo')}><option value="zh">中文</option><option value="lo">老挝语</option></select></div>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="course-sort-order">排序</label><Input id="course-sort-order" type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} /></div>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => void navigate({ to: '/content/courses' })}>取消</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? '正在创建…' : '创建草稿'}</Button></div>
      </form>
    </ListPageLayout>
  )
}
