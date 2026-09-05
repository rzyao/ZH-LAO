import { describe, expect, it } from 'vitest'

describe('Course detail structure editing', () => {
  it('keeps Unit sort orders contiguous after a reorder', () => {
    const units = [{ title: '第一单元', sortOrder: 1 }, { title: '第二单元', sortOrder: 2 }]
    const next = [...units]
    const [moved] = next.splice(1, 1)
    next.splice(0, 0, moved!)
    expect(next.map((unit, index) => ({ ...unit, sortOrder: index + 1 }))).toEqual([
      { title: '第二单元', sortOrder: 1 },
      { title: '第一单元', sortOrder: 2 },
    ])
  })
})
