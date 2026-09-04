import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { structuredContentApi } from './api'
import type { ContentCategoryConfig } from './contracts'

const key = (config: ContentCategoryConfig) => ['content-admin', config.contentType] as const

export function useStructuredContentList(config: ContentCategoryConfig) {
  return useQuery({ queryKey: key(config), queryFn: ({ signal }) => structuredContentApi.list(config, signal) })
}
export function useStructuredContentHistory(config: ContentCategoryConfig, contentId: string | null) {
  return useQuery({ queryKey: [...key(config), contentId, 'history'], queryFn: ({ signal }) => structuredContentApi.history(config, contentId!, signal), enabled: Boolean(contentId) })
}
export function useStructuredContentReferences(config: ContentCategoryConfig, contentId: string | null) {
  return useQuery({ queryKey: [...key(config), contentId, 'references'], queryFn: ({ signal }) => structuredContentApi.references(config, contentId!, signal), enabled: Boolean(contentId) })
}

function useContentMutation<T>(config: ContentCategoryConfig, mutationFn: (input: T) => Promise<unknown>) {
  const client = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries({ queryKey: key(config) }) })
}

export function useCreateStructuredContent(config: ContentCategoryConfig) {
  return useContentMutation<Record<string, unknown>>(config, (snapshot) => structuredContentApi.create(config, snapshot))
}
export function useUpdateStructuredContent(config: ContentCategoryConfig) {
  return useContentMutation<{ contentId: string; revisionId: string; snapshot: Record<string, unknown>; expectedLockVersion: number }>(config, ({ contentId, revisionId, snapshot, expectedLockVersion }) => structuredContentApi.update(config, contentId, revisionId, snapshot, expectedLockVersion))
}
export function useSubmitStructuredContent(config: ContentCategoryConfig) {
  return useContentMutation<{ contentId: string; revisionId: string }>(config, ({ contentId, revisionId }) => structuredContentApi.submit(config, contentId, revisionId))
}
export function useReviewStructuredContent(config: ContentCategoryConfig) {
  return useContentMutation<{ contentId: string; revisionId: string; action: 'approve' | 'reject'; remark?: string }>(config, ({ contentId, revisionId, action, remark }) => structuredContentApi.review(config, contentId, revisionId, action, remark))
}
export function useReEditStructuredContent(config: ContentCategoryConfig) {
  return useContentMutation<{ contentId: string; revisionId: string }>(config, ({ contentId, revisionId }) => structuredContentApi.reEdit(config, contentId, revisionId))
}
export function usePublishStructuredContent(config: ContentCategoryConfig) {
  return useContentMutation<{ contentId: string; revisionId: string }>(config, ({ contentId, revisionId }) => structuredContentApi.publish(config, contentId, revisionId))
}
export function useDeriveStructuredContent(config: ContentCategoryConfig) {
  return useContentMutation<string>(config, (contentId) => structuredContentApi.derive(config, contentId))
}
