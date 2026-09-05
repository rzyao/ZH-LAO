import { apiClient } from '@/api/client'
import type { ContentCategoryConfig, ContentReferenceItem, ManagedStructuredContentList, StructuredRevisionItem } from './contracts'

const base = '/api/v1/admin/content'
const itemBase = (config: ContentCategoryConfig, contentId: string, revisionId: string) =>
  `${base}/${config.apiPath}/${encodeURIComponent(contentId)}/revisions/${encodeURIComponent(revisionId)}`
const idempotencyHeaders = () => ({ 'Idempotency-Key': crypto.randomUUID() })

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
    return (await apiClient.post(`${itemBase(config, contentId, revisionId)}/submit`, { headers: idempotencyHeaders() })).data
  },
  async review(config: ContentCategoryConfig, contentId: string, revisionId: string, action: 'approve' | 'reject', remark?: string) {
    return (await apiClient.post(`${itemBase(config, contentId, revisionId)}/review`, { json: { action, remark }, headers: idempotencyHeaders() })).data
  },
  async reEdit(config: ContentCategoryConfig, contentId: string, revisionId: string) {
    return (await apiClient.post(`${itemBase(config, contentId, revisionId)}/re-edit`)).data
  },
  async publish(config: ContentCategoryConfig, contentId: string, revisionId: string) {
    return (await apiClient.post(`${itemBase(config, contentId, revisionId)}/publish`, { headers: idempotencyHeaders() })).data
  },
  async derive(config: ContentCategoryConfig, contentId: string) {
    return (await apiClient.post(`${base}/${config.apiPath}/${encodeURIComponent(contentId)}/derive-working`)).data
  },
  async replaceDictionarySection(
    contentId: string,
    section: 'meanings' | 'examples' | 'relationships' | 'tags',
    body: Record<string, unknown>,
  ) {
    return (await apiClient.put(`${base}/knowledge/${encodeURIComponent(contentId)}/${section}`, { json: body, headers: idempotencyHeaders() })).data
  },
}
