import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatRelativeTime, toIso } from './time'

describe('Time contract', () => {
  const fixed = '2026-08-30T09:00:00.000Z'

  it('formats a date', () => {
    expect(formatDate(fixed)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('formats a date-time with local timezone', () => {
    expect(formatDateTime(fixed)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('formats relative time', () => {
    expect(formatRelativeTime(new Date(Date.now() - 5 * 1000))).toBe('刚刚')
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000))).toContain('分钟前')
    expect(formatRelativeTime(new Date(Date.now() - 5 * 3600 * 1000))).toContain('小时前')
    expect(formatRelativeTime(new Date(Date.now() - 5 * 86400 * 1000))).toContain('天前')
  })

  it('returns fallbacks for invalid input', () => {
    expect(formatDate('invalid')).toBe('—')
    expect(formatDateTime('invalid')).toBe('—')
    expect(formatRelativeTime('invalid')).toBe('—')
    expect(toIso('invalid')).toBeNull()
  })

  it('parses to canonical ISO', () => {
    expect(toIso(fixed)).toBe(fixed)
  })
})
