/**
 * Pagination contract — Admin Foundation (frozen).
 *
 * Two supported modes, kept as separate contracts so generic components never
 * mix them into one business implementation:
 *
 * - Offset/Page : simple management lists.
 * - Cursor      : Chat, Feed, Audit, Ledger and large lists.
 *
 * The shared DataTable pagination component stays backend-agnostic; the
 * concrete contract is chosen by each Domain API.
 */

/* ---------- Offset / Page ---------- */

export interface PageParams {
  page: number
  pageSize: number
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PageResponse<T> {
  items: T[]
  meta: PageMeta
}

/* ---------- Cursor ---------- */

export interface CursorParams {
  cursor?: string
  limit: number
}

export interface CursorMeta {
  nextCursor: string | null
  hasMore: boolean
}

export interface CursorResponse<T> {
  items: T[]
  meta: CursorMeta
}

/* ---------- Search param serialization helpers ---------- */

export function pageParamsToSearch(params: PageParams): Record<string, string> {
  return {
    page: String(params.page),
    pageSize: String(params.pageSize),
  }
}

export function cursorParamsToSearch(params: CursorParams): Record<string, string> {
  const out: Record<string, string> = { limit: String(params.limit) }
  if (params.cursor) out.cursor = params.cursor
  return out
}
