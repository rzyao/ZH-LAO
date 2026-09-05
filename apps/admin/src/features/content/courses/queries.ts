import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courseAdminApi } from './api'
import type { CourseSnapshot, LessonSnapshot } from './api'

export const courseQueryKeys = { root: ['content-admin', 'courses'] as const }

export function useCourseList() {
  return useQuery({ queryKey: courseQueryKeys.root, queryFn: ({ signal }) => courseAdminApi.list(signal) })
}
export function useCourseDetail(courseId: string) {
  return useQuery({ queryKey: [...courseQueryKeys.root, courseId], queryFn: ({ signal }) => courseAdminApi.get(courseId, signal) })
}

export function useCreateCourse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: courseAdminApi.create,
    onSuccess: () => client.invalidateQueries({ queryKey: courseQueryKeys.root }),
  })
}
export function useCourseLifecycle(courseId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Readonly<{ revisionId: string; lockVersion: number; command: 'submit' | 'publish' | 'approve' | 'reject'; remark?: string }>) => input.command === 'submit'
      ? courseAdminApi.submit(courseId, input.revisionId, input.lockVersion)
      : input.command === 'publish' ? courseAdminApi.publish(courseId, input.revisionId, input.lockVersion)
        : courseAdminApi.review(courseId, input.revisionId, input.lockVersion, input.command === 'approve' ? 'approve' : 'reject', input.remark),
    onSuccess: () => client.invalidateQueries({ queryKey: [...courseQueryKeys.root, courseId] }),
  })
}
export function useDeriveCourseWorking(courseId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (input: Readonly<{ revisionId: string; updatedAt: string }>) => courseAdminApi.deriveWorking(courseId, input.revisionId, input.updatedAt), onSuccess: () => client.invalidateQueries({ queryKey: [...courseQueryKeys.root, courseId] }) })
}
export function useReplaceCourseStructure(courseId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (input: Readonly<{ revisionId: string; lockVersion: number; updatedAt: string; snapshot: CourseSnapshot }>) => courseAdminApi.replaceStructure(courseId, input.revisionId, input.lockVersion, input.updatedAt, input.snapshot), onSuccess: () => client.invalidateQueries({ queryKey: [...courseQueryKeys.root, courseId] }) })
}

export function useCreateLesson() {
  const client = useQueryClient()
  return useMutation({ mutationFn: courseAdminApi.createLesson, onSuccess: () => client.invalidateQueries({ queryKey: courseQueryKeys.root }) })
}
export function useLessonDetail(lessonId: string) {
  return useQuery({ queryKey: [...courseQueryKeys.root, 'lesson', lessonId], queryFn: ({ signal }) => courseAdminApi.getLesson(lessonId, signal) })
}
export function useLessonLifecycle(lessonId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (input: Readonly<{ revisionId: string; lockVersion: number; command: 'submit' | 'publish' | 'approve' | 'reject'; remark?: string }>) => input.command === 'submit' ? courseAdminApi.submitLesson(lessonId, input.revisionId, input.lockVersion) : input.command === 'publish' ? courseAdminApi.publishLesson(lessonId, input.revisionId, input.lockVersion) : courseAdminApi.reviewLesson(lessonId, input.revisionId, input.lockVersion, input.command === 'approve' ? 'approve' : 'reject', input.remark), onSuccess: () => client.invalidateQueries({ queryKey: [...courseQueryKeys.root, 'lesson', lessonId] }) })
}
export function useReplaceLessonStructure(lessonId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (input: Readonly<{ revisionId: string; lockVersion: number; updatedAt: string; snapshot: LessonSnapshot }>) => courseAdminApi.replaceLessonStructure(lessonId, input.revisionId, input.lockVersion, input.updatedAt, input.snapshot), onSuccess: () => client.invalidateQueries({ queryKey: [...courseQueryKeys.root, 'lesson', lessonId] }) })
}
export function useDeriveLessonWorking(lessonId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (input: Readonly<{ revisionId: string; updatedAt: string }>) => courseAdminApi.deriveLessonWorking(lessonId, input.revisionId, input.updatedAt), onSuccess: () => client.invalidateQueries({ queryKey: [...courseQueryKeys.root, 'lesson', lessonId] }) })
}
