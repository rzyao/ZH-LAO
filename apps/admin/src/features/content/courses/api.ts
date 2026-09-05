import { apiClient } from '@/api/client'

export type ManagedCourse = Readonly<{
  id: string
  learningLanguage: 'zh' | 'lo'
  title: string
  status: 'draft' | 'published' | 'archived'
  sortOrder: number
  publishedRevisionId: string | null
  workingRevisionId: string | null
  workingRevisionStatus: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'superseded' | null
  updatedAt?: string
}>
export type CourseSnapshot = Readonly<{ title: string; subtitle?: string; description?: string; sortOrder: number; units: readonly Readonly<{ title: string; description?: string; sortOrder: number; lessons: readonly Readonly<{ lessonId: string; revisionId: string; title: string; sortOrder: number }>[] }>[] }>
export type ManagedCourseDetail = ManagedCourse & Readonly<{ workingSnapshot: CourseSnapshot | null; publishedLessons: readonly Readonly<{ lessonId: string; revisionId: string; title: string; unitSortOrder: number; sortOrder: number }>[]; revisions: readonly Readonly<{ id: string; number: number; status: NonNullable<ManagedCourse['workingRevisionStatus']>; lockVersion: number; createdAt: string; reviewedAt: string | null; reviewRemark: string | null }>[] }>
export type LessonItem = Readonly<{ itemType: 'content' | 'exercise'; entityId: string; revisionId: string; sortOrder: number }>
export type LessonSnapshot = Readonly<{ sections: readonly Readonly<{ sectionType: 'introduction' | 'knowledge' | 'example' | 'practice' | 'summary' | 'custom'; title?: string | null; description?: string | null; sortOrder: number; items: readonly LessonItem[] }>[] }>
export type ManagedLessonDetail = Readonly<{ id: string; courseId: string; unitSortOrder: number; title: string; description: string | null; sortOrder: number; status: ManagedCourse['status']; publishedRevisionId: string | null; workingRevisionId: string | null; workingRevisionStatus: ManagedCourse['workingRevisionStatus']; updatedAt: string; workingSnapshot: LessonSnapshot | null; revisions: ManagedCourseDetail['revisions'] }>

const base = '/api/v1/admin/content/courses'
const lessonsBase = '/api/v1/admin/content/lessons'
const idempotencyKey = () => crypto.randomUUID()

export const courseAdminApi = {
  async list(signal?: AbortSignal): Promise<readonly ManagedCourse[]> {
    return (await apiClient.get<readonly ManagedCourse[]>(base, { signal })).data
  },
  async create(input: Readonly<{ learningLanguage: 'zh' | 'lo'; snapshot: Readonly<{ title: string; subtitle?: string; description?: string; sortOrder: number; units: readonly [] }> }>) {
    return (await apiClient.post<{ courseId: string; revisionId: string; lockVersion: number }>(base, { json: input })).data
  },
  async get(courseId: string, signal?: AbortSignal): Promise<ManagedCourseDetail> {
    return (await apiClient.get<ManagedCourseDetail>(`${base}/${courseId}`, { signal })).data
  },
  async submit(courseId: string, revisionId: string, expectedLockVersion: number) {
    return (await apiClient.post(`${base}/${courseId}/revisions/${revisionId}/submit`, { json: { expectedLockVersion }, headers: { 'Idempotency-Key': idempotencyKey() } })).data
  },
  async review(courseId: string, revisionId: string, expectedLockVersion: number, action: 'approve' | 'reject', remark?: string) {
    return (await apiClient.post(`${base}/${courseId}/revisions/${revisionId}/review`, { json: { expectedLockVersion, action, remark }, headers: { 'Idempotency-Key': idempotencyKey() } })).data
  },
  async publish(courseId: string, revisionId: string, expectedLockVersion: number) {
    return (await apiClient.post(`${base}/${courseId}/revisions/${revisionId}/publish`, { json: { expectedLockVersion }, headers: { 'Idempotency-Key': idempotencyKey() } })).data
  },
  async deriveWorking(courseId: string, revisionId: string, expectedUpdatedAt: string) {
    return (await apiClient.post(`${base}/${courseId}/revisions/${revisionId}/re-edit`, { json: { expectedUpdatedAt } })).data
  },
  async replaceStructure(courseId: string, revisionId: string, expectedLockVersion: number, expectedUpdatedAt: string, snapshot: CourseSnapshot) {
    return (await apiClient.put(`${base}/${courseId}/structure`, { json: { revisionId, expectedLockVersion, expectedUpdatedAt, snapshot } })).data
  },
  async createLesson(input: Readonly<{ courseId: string; unitSortOrder: number; title: string; description?: string; sortOrder: number; snapshot: LessonSnapshot }>) {
    return (await apiClient.post<{ lessonId: string; revisionId: string; lockVersion: number }>(lessonsBase, { json: input })).data
  },
  async getLesson(lessonId: string, signal?: AbortSignal): Promise<ManagedLessonDetail> {
    return (await apiClient.get<ManagedLessonDetail>(`${lessonsBase}/${lessonId}`, { signal })).data
  },
  async replaceLessonStructure(lessonId: string, revisionId: string, expectedLockVersion: number, expectedUpdatedAt: string, snapshot: LessonSnapshot) {
    return (await apiClient.put(`${lessonsBase}/${lessonId}/structure`, { json: { revisionId, expectedLockVersion, expectedUpdatedAt, snapshot } })).data
  },
  async submitLesson(lessonId: string, revisionId: string, expectedLockVersion: number) { return (await apiClient.post(`${lessonsBase}/${lessonId}/revisions/${revisionId}/submit`, { json: { expectedLockVersion }, headers: { 'Idempotency-Key': idempotencyKey() } })).data },
  async reviewLesson(lessonId: string, revisionId: string, expectedLockVersion: number, action: 'approve' | 'reject', remark?: string) { return (await apiClient.post(`${lessonsBase}/${lessonId}/revisions/${revisionId}/review`, { json: { expectedLockVersion, action, remark }, headers: { 'Idempotency-Key': idempotencyKey() } })).data },
  async publishLesson(lessonId: string, revisionId: string, expectedLockVersion: number) { return (await apiClient.post(`${lessonsBase}/${lessonId}/revisions/${revisionId}/publish`, { json: { expectedLockVersion }, headers: { 'Idempotency-Key': idempotencyKey() } })).data },
  async deriveLessonWorking(lessonId: string, revisionId: string, expectedUpdatedAt: string) { return (await apiClient.post(`${lessonsBase}/${lessonId}/revisions/${revisionId}/re-edit`, { json: { expectedUpdatedAt } })).data },
}
