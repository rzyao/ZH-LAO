import { describe, expect, it } from 'vitest'
import { can, createPermission, parsePermission } from './permissions'

describe('permissions contract', () => {
  it('parses domain.resource.action', () => {
    expect(parsePermission('content.course.read')).toEqual({
      domain: 'content',
      resource: 'course',
      action: 'read',
    })
  })

  it('creates permission keys', () => {
    expect(createPermission('audio', 'task', 'review')).toBe('audio.task.review')
  })

  it('checks exact matches', () => {
    expect(can(['content.course.read'], 'content.course.read')).toBe(true)
    expect(can(['content.course.read'], 'content.course.update')).toBe(false)
  })

  it('supports wildcard grants', () => {
    expect(can(['content.*.*'], 'content.course.update')).toBe(true)
    expect(can(['content.course.*'], 'content.course.delete')).toBe(true)
    expect(can(['content.course.*'], 'learning.course.read')).toBe(false)
    expect(can(['*.*.*'], 'trust.case.decide')).toBe(true)
  })

  it('returns false for empty permission sets', () => {
    expect(can([], 'content.course.read')).toBe(false)
  })
})
