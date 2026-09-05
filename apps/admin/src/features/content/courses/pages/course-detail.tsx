import { useNavigate, useParams } from '@tanstack/react-router'
import * as React from 'react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CourseSnapshot, ManagedCourseDetail } from '../api'
import { RevisionHistory } from '../components/revision-history'
import { useCourseDetail, useCourseLifecycle, useCreateLesson, useDeriveCourseWorking, useReplaceCourseStructure } from '../queries'

type Unit = CourseSnapshot['units'][number]

function normalizedUnits(units: readonly Unit[]): Unit[] {
  return units.map((unit, index) => ({ ...unit, sortOrder: index + 1 }))
}

export function CourseDetailPage() {
  const { courseId } = useParams({ from: '/shell/content/courses/$courseId' })
  const navigate = useNavigate()
  const query = useCourseDetail(courseId)
  const lifecycle = useCourseLifecycle(courseId)
  const deriveWorking = useDeriveCourseWorking(courseId)
  const replaceStructure = useReplaceCourseStructure(courseId)
  const createLesson = useCreateLesson()
  const [reviewing, setReviewing] = React.useState<string | null>(null)
  const [remark, setRemark] = React.useState('')
  const [loadedRevisionId, setLoadedRevisionId] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState('')
  const [sortOrder, setSortOrder] = React.useState(0)
  const [units, setUnits] = React.useState<Unit[]>([])
  const [newUnitTitle, setNewUnitTitle] = React.useState('')
  const [newLessonTitles, setNewLessonTitles] = React.useState<Record<number, string>>({})
  const workingSnapshot = query.data?.workingSnapshot
  const workingRevisionId = query.data?.workingRevisionId

  React.useEffect(() => {
    if (!workingSnapshot || !workingRevisionId || loadedRevisionId === workingRevisionId) return
    setLoadedRevisionId(workingRevisionId)
    setTitle(workingSnapshot.title)
    setSortOrder(workingSnapshot.sortOrder)
    setUnits(normalizedUnits(workingSnapshot.units))
    setNewUnitTitle('')
  }, [loadedRevisionId, workingRevisionId, workingSnapshot])

  if (query.isPending) return <ListPageLayout title="课程详情" description="正在读取课程版本…" breadcrumb={[{ label: '课程管理', href: '/content/courses' }, { label: '课程详情' }]}>{null}</ListPageLayout>
  if (query.error || !query.data) return <ErrorState title="无法读取课程" message="请稍后重试。" onRetry={() => void query.refetch()} />
  const course = query.data
  const moveUnit = (from: number, to: number) => setUnits((current) => {
    const next = [...current]
    const [moved] = next.splice(from, 1)
    if (moved) next.splice(to, 0, moved)
    return normalizedUnits(next)
  })
  const addUnit = () => {
    const unitTitle = newUnitTitle.trim()
    if (!unitTitle) return
    setUnits((current) => [...current, { title: unitTitle, sortOrder: current.length + 1, lessons: [] }])
    setNewUnitTitle('')
  }
  const removeUnit = (index: number) => setUnits((current) => normalizedUnits(current.filter((_, itemIndex) => itemIndex !== index)))
  const createLessonForUnit = async (unit: Unit) => {
    const lessonTitle = newLessonTitles[unit.sortOrder]?.trim()
    if (!lessonTitle) return
    const result = await createLesson.mutateAsync({ courseId, unitSortOrder: unit.sortOrder, title: lessonTitle, sortOrder: unit.lessons.length + 1, snapshot: { sections: [] } })
    await navigate({ to: '/content/lessons/$lessonId', params: { lessonId: result.lessonId } })
  }
  const attachPublishedLesson = (unit: Unit, lesson: ManagedCourseDetail['publishedLessons'][number]) => {
    setUnits((current) => current.map((item) => item.sortOrder !== unit.sortOrder ? item : {
      ...item,
      lessons: item.lessons.some((existing) => existing.revisionId === lesson.revisionId) ? item.lessons : [...item.lessons, { lessonId: lesson.lessonId, revisionId: lesson.revisionId, title: lesson.title, sortOrder: item.lessons.length + 1 }],
    }))
  }
  const moveLesson = (unitSortOrder: number, from: number, to: number) => setUnits((current) => current.map((unit) => {
    if (unit.sortOrder !== unitSortOrder) return unit
    const lessons = [...unit.lessons]
    const [moved] = lessons.splice(from, 1)
    if (moved) lessons.splice(to, 0, moved)
    return { ...unit, lessons: lessons.map((lesson, index) => ({ ...lesson, sortOrder: index + 1 })) }
  }))
  const save = () => {
    const revision = course.revisions.find((item) => item.id === course.workingRevisionId)
    if (!revision || !course.updatedAt || !workingSnapshot) return
    replaceStructure.mutate({ revisionId: revision.id, lockVersion: revision.lockVersion, updatedAt: course.updatedAt, snapshot: { ...workingSnapshot, title: title.trim(), sortOrder, units } })
  }
  return <ListPageLayout title={course.title} description={`${course.learningLanguage === 'zh' ? '中文' : '老挝语'}课程 · ${course.status === 'published' ? '已发布' : '草稿'}`} breadcrumb={[{ label: '课程管理', href: '/content/courses' }, { label: course.title }]}>
    {lifecycle.error || deriveWorking.error || replaceStructure.error ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">操作未完成，请刷新课程状态后重试。</p> : null}
    {course.status === 'published' && course.publishedRevisionId && course.updatedAt ? <div className="flex justify-end"><Button variant="outline" disabled={deriveWorking.isPending} onClick={() => deriveWorking.mutate({ revisionId: course.publishedRevisionId!, updatedAt: course.updatedAt! })}>创建工作版本</Button></div> : null}
    {workingSnapshot && course.workingRevisionId && course.updatedAt ? <section className="rounded-lg border bg-card p-6"><h2 className="text-base font-semibold text-foreground">课程工作版本</h2><p className="mt-1 text-sm text-muted-foreground">编辑基本信息和 Unit 顺序后保存；课节引用保持固定的已发布 revision。</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="working-course-title">课程名称</label><Input id="working-course-title" value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="working-course-order">排序</label><Input id="working-course-order" type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} /></div></div><div className="mt-6 flex gap-2"><Input aria-label="新 Unit 名称" placeholder="新 Unit 名称" value={newUnitTitle} onChange={(event) => setNewUnitTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addUnit() } }} /><Button variant="outline" disabled={!newUnitTitle.trim()} onClick={addUnit}>新增 Unit</Button></div><ol className="mt-3 divide-y rounded-md border">{units.map((unit, index) => <li key={`${unit.title}-${index}`} className="px-4 py-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-foreground">{unit.sortOrder}. {unit.title}</p><p className="text-sm text-muted-foreground">{unit.lessons.length} 个课节</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveUnit(index, index - 1)}>上移</Button><Button size="sm" variant="outline" disabled={index === units.length - 1} onClick={() => moveUnit(index, index + 1)}>下移</Button><Button size="sm" variant="destructive" disabled={unit.lessons.length > 0} title={unit.lessons.length > 0 ? '请先移除或调整 Unit 内课节' : undefined} onClick={() => removeUnit(index)}>删除</Button></div></div><div className="mt-3 flex gap-2"><Input aria-label={`${unit.title}的新课节名称`} placeholder="新课节名称" value={newLessonTitles[unit.sortOrder] ?? ''} onChange={(event) => setNewLessonTitles((current) => ({ ...current, [unit.sortOrder]: event.target.value }))} /><Button size="sm" variant="outline" disabled={!newLessonTitles[unit.sortOrder]?.trim() || createLesson.isPending} onClick={() => void createLessonForUnit(unit)}>创建课节</Button></div></li>)}</ol><div className="mt-4 flex justify-end"><Button disabled={!title.trim() || replaceStructure.isPending} onClick={save}>保存工作版本</Button></div></section> : null}
    {workingSnapshot && course.workingRevisionId && course.publishedLessons.length > 0 ? <section className="mt-4 rounded-lg border bg-card p-6"><h2 className="text-base font-semibold">加入已发布课节</h2><p className="mt-1 text-sm text-muted-foreground">仅显示同一课程和同一 Unit 的已发布课节版本；加入后请保存课程工作版本。</p><div className="mt-4 space-y-2">{course.publishedLessons.map((lesson) => { const unit = units.find((item) => item.sortOrder === lesson.unitSortOrder); const attached = unit?.lessons.some((item) => item.revisionId === lesson.revisionId); return <div key={lesson.revisionId} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"><span className="text-sm">Unit {lesson.unitSortOrder} · {lesson.title}</span><Button size="sm" variant="outline" disabled={!unit || attached} onClick={() => unit && attachPublishedLesson(unit, lesson)}>{attached ? '已加入' : '加入课程'}</Button></div> })}</div></section> : null}
    {workingSnapshot && course.workingRevisionId ? <section className="mt-4 rounded-lg border bg-card p-6"><h2 className="text-base font-semibold">课节顺序</h2><p className="mt-1 text-sm text-muted-foreground">调整后的顺序会随课程工作版本一并保存。</p>{units.map((unit) => unit.lessons.length > 0 ? <div key={unit.sortOrder} className="mt-4"><h3 className="text-sm font-medium">{unit.title}</h3><ol className="mt-2 divide-y rounded-md border">{unit.lessons.map((lesson, index) => <li key={lesson.revisionId} className="flex items-center justify-between gap-3 px-3 py-2"><span className="text-sm">{lesson.sortOrder}. {lesson.title}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveLesson(unit.sortOrder, index, index - 1)}>上移</Button><Button size="sm" variant="outline" disabled={index === unit.lessons.length - 1} onClick={() => moveLesson(unit.sortOrder, index, index + 1)}>下移</Button></div></li>)}</ol></div> : null)}</section> : null}
    <RevisionHistory revisions={course.revisions} onSubmit={(revisionId) => { const revision = course.revisions.find((item) => item.id === revisionId); if (revision) lifecycle.mutate({ revisionId, lockVersion: revision.lockVersion, command: 'submit' }) }} onReview={setReviewing} onPublish={(revisionId) => { const revision = course.revisions.find((item) => item.id === revisionId); if (revision) lifecycle.mutate({ revisionId, lockVersion: revision.lockVersion, command: 'publish' }) }} />
    <Dialog open={Boolean(reviewing)} onOpenChange={(open) => { if (!open) { setReviewing(null); setRemark('') } }}><DialogContent><DialogHeader><DialogTitle>审核课程版本</DialogTitle><DialogDescription>通过后可发布；驳回必须说明需要修改的原因。</DialogDescription></DialogHeader><div className="space-y-2"><label className="text-sm font-medium" htmlFor="course-review-remark">驳回原因</label><Input id="course-review-remark" value={remark} onChange={(event) => setRemark(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setReviewing(null)}>取消</Button><Button variant="destructive" disabled={!remark.trim() || lifecycle.isPending} onClick={() => { const revision = course.revisions.find((item) => item.id === reviewing); if (revision) lifecycle.mutate({ revisionId: revision.id, lockVersion: revision.lockVersion, command: 'reject', remark }, { onSuccess: () => setReviewing(null) }) }}>驳回</Button><Button disabled={lifecycle.isPending} onClick={() => { const revision = course.revisions.find((item) => item.id === reviewing); if (revision) lifecycle.mutate({ revisionId: revision.id, lockVersion: revision.lockVersion, command: 'approve' }, { onSuccess: () => setReviewing(null) }) }}>通过审核</Button></DialogFooter></DialogContent></Dialog>
  </ListPageLayout>
}
