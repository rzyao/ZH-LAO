import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { laoLetterAdminApi, structuredContentApi } from './api'
import type { ContentCategoryConfig } from './contracts'
import { normalizeLaoLetterSearch, type LaoLetterBatchItemStatus, type LaoLetterSearchInput } from './contracts'

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

export const laoLetterQueryKeys = {
  root: ['content-admin', 'lo-letter-list'] as const,
  list: (search: LaoLetterSearchInput) => [
    ...laoLetterQueryKeys.root,
    normalizeLaoLetterSearch(search),
  ] as const,
}

export const laoLetterBatchTaskKeys = {
  root: ['content-admin', 'lo-letter-batch-tasks'] as const,
  list: (page: number, pageSize: number) => [...laoLetterBatchTaskKeys.root, 'list', page, pageSize] as const,
  detail: (taskId: string, page: number, pageSize: number, status?: LaoLetterBatchItemStatus) =>
    [...laoLetterBatchTaskKeys.root, 'detail', taskId, page, pageSize, status ?? 'all'] as const,
}

export function useLaoLetterList(search: LaoLetterSearchInput) {
  const normalized = normalizeLaoLetterSearch(search)
  return useQuery({
    queryKey: laoLetterQueryKeys.list(normalized),
    queryFn: ({ signal }) => laoLetterAdminApi.list(normalized, signal),
    placeholderData: (previousData) => previousData,
  })
}

export function useLaoLetterSelectionPreview() {
  return useMutation({
    mutationFn: (search: LaoLetterSearchInput) => laoLetterAdminApi.previewSelection(search),
  })
}

export function useLaoLetterBatchStart() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: laoLetterAdminApi.startBatch,
    onSuccess: () => client.invalidateQueries({ queryKey: laoLetterQueryKeys.root }),
  })
}

export function useLaoLetterBatchTaskList(page: number, pageSize: number) {
  return useQuery({
    queryKey: laoLetterBatchTaskKeys.list(page, pageSize),
    queryFn: ({ signal }) => laoLetterAdminApi.listBatchTasks(page, pageSize, signal),
  })
}

export function useLaoLetterBatchTask(taskId: string, page: number, pageSize: number, status?: LaoLetterBatchItemStatus, visible = true) {
  return useQuery({
    queryKey: laoLetterBatchTaskKeys.detail(taskId, page, pageSize, status),
    queryFn: ({ signal }) => laoLetterAdminApi.getBatchTask(taskId, page, pageSize, status, signal),
    enabled: visible && taskId.length > 0,
    refetchInterval: (query) => {
      const state = query.state.data?.task.status
      return state === 'queued' || state === 'running' ? 2_000 : false
    },
  })
}

export function useLaoLetterBatchRetry() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: laoLetterAdminApi.retryFailed,
    onSuccess: async (task) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: laoLetterBatchTaskKeys.root }),
        client.invalidateQueries({ queryKey: laoLetterQueryKeys.root }),
        client.refetchQueries({ queryKey: [...laoLetterBatchTaskKeys.root, 'detail', task.task_id] }),
      ])
    },
  })
}
