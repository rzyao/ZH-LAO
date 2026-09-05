import { apiClient } from '@/api/client'
import {
  LaoLetterListDataSchema,
  LaoLetterBatchTaskDetailSchema,
  LaoLetterBatchTaskListSchema,
  LaoLetterBatchTaskSummarySchema,
  LaoLetterSelectionPreviewSchema,
  laoLetterSelectionQuery,
  normalizeLaoLetterSearch,
  type ContentCategoryConfig,
  type ContentReferenceItem,
  type LaoLetterSearchInput,
  type LaoLetterSelectionQuery,
  type ManagedStructuredContentList,
  type StructuredRevisionItem,
} from './contracts'

const base = '/api/v1/admin/content'
const itemBase = (config: ContentCategoryConfig, contentId: string, revisionId: string) =>
  `${base}/${config.apiPath}/${encodeURIComponent(contentId)}/revisions/${encodeURIComponent(revisionId)}`

export const structuredContentApi = {
  async list(config: ContentCategoryConfig, signal?: AbortSignal) {
    return (await apiClient.get<ManagedStructuredContentList>(`${base}/${config.apiPath}`, { signal })).data
  },
  async history(config: ContentCategoryConfig, contentId: string, signal?: AbortSignal) {
    return (await apiClient.get<{ items: StructuredRevisionItem[]; total: number }>(`${base}/${config.apiPath}/${encodeURIComponent(contentId)}/history`, { signal })).data
  },
  async references(config: ContentCategoryConfig, contentId: string, signal?: AbortSignal) {
    return (await apiClient.get<{ items: ContentReferenceItem[]; total: number }>(`${base}/${config.apiPath}/${encodeURIComponent(contentId)}/references`, { signal })).data
  },
  async create(config: ContentCategoryConfig, snapshot: Record<string, unknown>) {
    return (await apiClient.post(`${base}/${config.apiPath}`, { json: { snapshot } })).data
  },
  async update(config: ContentCategoryConfig, contentId: string, revisionId: string, snapshot: Record<string, unknown>, expectedLockVersion: number) {
    return (await apiClient.put(itemBase(config, contentId, revisionId), { json: { snapshot, expectedLockVersion } })).data
  },
  async submit(config: ContentCategoryConfig, contentId: string, revisionId: string) {
    return (await apiClient.post(`${itemBase(config, contentId, revisionId)}/submit`)).data
  },
  async review(config: ContentCategoryConfig, contentId: string, revisionId: string, action: 'approve' | 'reject', remark?: string) {
    return (await apiClient.post(`${itemBase(config, contentId, revisionId)}/review`, { json: { action, remark } })).data
  },
  async reEdit(config: ContentCategoryConfig, contentId: string, revisionId: string) {
    return (await apiClient.post(`${itemBase(config, contentId, revisionId)}/re-edit`)).data
  },
  async publish(config: ContentCategoryConfig, contentId: string, revisionId: string) {
    return (await apiClient.post(`${itemBase(config, contentId, revisionId)}/publish`)).data
  },
  async derive(config: ContentCategoryConfig, contentId: string) {
    return (await apiClient.post(`${base}/${config.apiPath}/${encodeURIComponent(contentId)}/derive-working`)).data
  },
}

function laoLetterListPath(input: LaoLetterSearchInput): string {
  const query = normalizeLaoLetterSearch(input)
  const parameters = new URLSearchParams()
  if (query.q) parameters.set('q', query.q)
  if (query.letter_type.length > 0) parameters.set('letter_type', query.letter_type.join(','))
  if (query.letter_class.length > 0) parameters.set('letter_class', query.letter_class.join(','))
  if (query.content_status.length > 0) parameters.set('content_status', query.content_status.join(','))
  if (query.revision_status.length > 0) parameters.set('revision_status', query.revision_status.join(','))
  parameters.set('sort', query.sort)
  parameters.set('order', query.order)
  parameters.set('page', String(query.page))
  parameters.set('page_size', String(query.page_size))
  return `${base}/lo/letters?${parameters.toString()}`
}

export const laoLetterAdminApi = {
  async list(input: LaoLetterSearchInput, signal?: AbortSignal) {
    const response = await apiClient.get(laoLetterListPath(input), { signal })
    return LaoLetterListDataSchema.parse(response.data)
  },
  async previewSelection(input: LaoLetterSearchInput, signal?: AbortSignal) {
    const response = await apiClient.post(`${base}/lo/letters/selection-preview`, {
      json: { query: laoLetterSelectionQuery(input) },
      signal,
    })
    return LaoLetterSelectionPreviewSchema.parse(response.data)
  },
  async startBatch(input: Readonly<{
    action: string
    idempotencyKey: string
    reason?: string
    selection: Readonly<{ mode: 'explicit_ids'; content_ids: readonly string[]; expected_count: number }>
      | Readonly<{ mode: 'query_all'; query: LaoLetterSelectionQuery; expected_count: number; selection_hash: string }>
  }>) {
    const response = await apiClient.post(`${base}/lo/letters/batch-tasks`, {
      headers: { 'Idempotency-Key': input.idempotencyKey },
      json: {
        action: input.action,
        selection: input.selection,
        ...(input.reason === undefined ? {} : { reason: input.reason }),
      },
    })
    return LaoLetterBatchTaskSummarySchema.parse(response.data)
  },
  async listBatchTasks(page: number, pageSize: number, signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/lo/letters/batch-tasks?page=${page}&page_size=${pageSize}`, { signal })
    return LaoLetterBatchTaskListSchema.parse(response.data)
  },
  async getBatchTask(taskId: string, page: number, pageSize: number, status?: string, signal?: AbortSignal) {
    const parameters = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (status) parameters.set('status', status)
    const response = await apiClient.get(`${base}/lo/letters/batch-tasks/${encodeURIComponent(taskId)}?${parameters}`, { signal })
    return LaoLetterBatchTaskDetailSchema.parse(response.data)
  },
  async retryFailed(taskId: string) {
    const response = await apiClient.post(`${base}/lo/letters/batch-tasks/${encodeURIComponent(taskId)}/retry-failed`, {
      headers: { 'Idempotency-Key': globalThis.crypto.randomUUID() },
    })
    return LaoLetterBatchTaskSummarySchema.parse(response.data)
  },
}
