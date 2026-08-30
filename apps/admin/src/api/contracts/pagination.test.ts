import { describe, expect, it } from 'vitest'
import {
  cursorParamsToSearch,
  pageParamsToSearch,
} from './pagination'

describe('Pagination contract', () => {
  it('serializes offset/page params', () => {
    expect(pageParamsToSearch({ page: 2, pageSize: 20 })).toEqual({
      page: '2',
      pageSize: '20',
    })
  })

  it('serializes cursor params with and without cursor', () => {
    expect(cursorParamsToSearch({ limit: 20 })).toEqual({ limit: '20' })
    expect(cursorParamsToSearch({ limit: 20, cursor: 'abc' })).toEqual({
      limit: '20',
      cursor: 'abc',
    })
  })
})
