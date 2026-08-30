import { describe, expect, it } from 'vitest'
import { assertUuid, createUuid, isUuid } from './uuid'

describe('UUID contract', () => {
  it('validates UUID v4 strings', () => {
    const uuid = createUuid()
    expect(isUuid(uuid)).toBe(true)
    expect(isUuid('not-a-uuid')).toBe(false)
  })

  it('assertUuid throws for invalid values', () => {
    expect(() => assertUuid('123')).toThrow()
    expect(assertUuid('00000000-0000-4000-8000-000000000000')).toBe(
      '00000000-0000-4000-8000-000000000000',
    )
  })
})
