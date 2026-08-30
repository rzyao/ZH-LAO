/**
 * Time contract — Admin Foundation (frozen).
 *
 * API timestamps are ISO 8601 strings WITH timezone, e.g.
 * `2026-08-30T09:15:00.000Z` or `2026-08-30T17:15:00+08:00`.
 *
 * UI display always goes through the formatters below — business components
 * must not scatter `new Date(...).toLocaleString()` calls.
 */

export type IsoDateTime = string

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

function isInvalid(date: Date): boolean {
  return Number.isNaN(date.getTime())
}

/** `2026-08-30` (local timezone). */
export function formatDate(value: string | Date, fallback = '—'): string {
  const date = toDate(value)
  if (isInvalid(date)) return fallback
  return dateFormatter.format(date).replaceAll('/', '-')
}

/** `2026-08-30 17:05` (local timezone). */
export function formatDateTime(value: string | Date, fallback = '—'): string {
  const date = toDate(value)
  if (isInvalid(date)) return fallback
  return dateTimeFormatter.format(date).replaceAll('/', '-')
}

/** Compact relative time, e.g. `5 分钟前`, `2 小时前`, `昨天`. */
export function formatRelativeTime(value: string | Date, fallback = '—'): string {
  const date = toDate(value)
  if (isInvalid(date)) return fallback
  const diffMs = Date.now() - date.getTime()
  const seconds = Math.round(diffMs / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)

  if (seconds < 10) return '刚刚'
  if (seconds < 60) return `${seconds} 秒前`
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return formatDate(value)
}

/** Parse and re-serialize to a canonical ISO 8601 string (keeps tz info). */
export function toIso(value: string | Date): IsoDateTime | null {
  const date = toDate(value)
  if (isInvalid(date)) return null
  return date.toISOString()
}
