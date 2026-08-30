/**
 * Pagination contract.
 *
 * The Foundation supports BOTH cursor and offset/page pagination. Domains are
 * not forced into a single strategy — the choice belongs to the API contract.
 * Large lists, feeds and chat histories should prefer cursor pagination.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/* -------------------------------------------------------------------------- */
/* Cursor pagination                                                          */
/* -------------------------------------------------------------------------- */

export interface CursorPaginationParams {
  readonly cursor?: string | null;
  readonly limit?: number;
}

export interface CursorPage<T> {
  readonly kind: 'cursor';
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

/* -------------------------------------------------------------------------- */
/* Offset / page pagination                                                   */
/* -------------------------------------------------------------------------- */

export interface OffsetPaginationParams {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface OffsetPage<T> {
  readonly kind: 'offset';
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number | null;
  readonly hasMore: boolean;
}

/* -------------------------------------------------------------------------- */
/* Unions and helpers                                                         */
/* -------------------------------------------------------------------------- */

export type PaginationParams = CursorPaginationParams | OffsetPaginationParams;
export type Page<T> = CursorPage<T> | OffsetPage<T>;

export function isCursorPage<T>(page: Page<T>): page is CursorPage<T> {
  return page.kind === 'cursor';
}

export function isOffsetPage<T>(page: Page<T>): page is OffsetPage<T> {
  return page.kind === 'offset';
}

export function emptyCursorPage<T>(): CursorPage<T> {
  return { kind: 'cursor', items: [], nextCursor: null, hasMore: false };
}

export function emptyOffsetPage<T>(pageSize: number = DEFAULT_PAGE_SIZE): OffsetPage<T> {
  return { kind: 'offset', items: [], page: 1, pageSize, total: null, hasMore: false };
}

export function clampPageSize(size: number | undefined | null): number {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(size), MAX_PAGE_SIZE);
}

/** Cursor pagination: builds query params for the V2 HTTP client. */
export function toCursorQuery(params: CursorPaginationParams): Record<string, string | number> {
  const query: Record<string, string | number> = { limit: clampPageSize(params.limit) };
  if (params.cursor) {
    query.cursor = params.cursor;
  }
  return query;
}

/** Offset pagination: builds query params for the V2 HTTP client. */
export function toOffsetQuery(params: OffsetPaginationParams): Record<string, string | number> {
  return {
    page: Math.max(1, Math.floor(params.page ?? 1)),
    pageSize: clampPageSize(params.pageSize),
  };
}

/** Appends the next cursor page to an accumulated list (dedup by reference). */
export function mergeCursorPages<T>(previous: CursorPage<T>, next: CursorPage<T>): CursorPage<T> {
  return {
    kind: 'cursor',
    items: [...previous.items, ...next.items],
    nextCursor: next.nextCursor,
    hasMore: next.hasMore,
  };
}

/** Appends an offset page, replacing the item window (offset pages are windows). */
export function mergeOffsetPages<T>(previous: OffsetPage<T>, next: OffsetPage<T>): OffsetPage<T> {
  return {
    kind: 'offset',
    items: next.page > previous.page ? [...previous.items, ...next.items] : next.items,
    page: next.page,
    pageSize: next.pageSize,
    total: next.total ?? previous.total,
    hasMore: next.hasMore,
  };
}

/** Normalises a raw server payload into a cursor page. */
export function parseCursorPage<T>(
  payload: {
    items?: readonly T[] | null;
    nextCursor?: string | null;
    hasMore?: boolean | null;
  } | null | undefined,
): CursorPage<T> {
  if (!payload) {
    return emptyCursorPage<T>();
  }
  const items = payload.items ?? [];
  return {
    kind: 'cursor',
    items,
    nextCursor: payload.nextCursor ?? null,
    hasMore: payload.hasMore ?? Boolean(payload.nextCursor),
  };
}

/** Normalises a raw server payload into an offset page. */
export function parseOffsetPage<T>(
  payload: {
    items?: readonly T[] | null;
    page?: number | null;
    pageSize?: number | null;
    total?: number | null;
    hasMore?: boolean | null;
  } | null | undefined,
): OffsetPage<T> {
  if (!payload) {
    return emptyOffsetPage<T>();
  }
  const items = payload.items ?? [];
  const page = Math.max(1, Math.floor(payload.page ?? 1));
  const pageSize = clampPageSize(payload.pageSize ?? DEFAULT_PAGE_SIZE);
  const total = typeof payload.total === 'number' ? payload.total : null;

  return {
    kind: 'offset',
    items,
    page,
    pageSize,
    total,
    hasMore: payload.hasMore ?? (total !== null ? page * pageSize < total : false),
  };
}
