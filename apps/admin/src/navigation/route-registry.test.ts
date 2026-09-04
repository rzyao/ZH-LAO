import { describe, expect, it } from 'vitest'
import { ADMIN_ROUTE_TARGETS, findRouteTargetByHref, findRouteTargetByKey, ROUTE_TARGET_KEYS } from './route-registry'

describe('route-registry (white-list single source of truth)', () => {
  it('has unique stable keys (FR-015)', () => {
    const keys = ADMIN_ROUTE_TARGETS.map((t) => t.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('keys are lower_snake_case, matching backend MENU_ROUTE_TARGET_KEYS regex', () => {
    for (const target of ADMIN_ROUTE_TARGETS) {
      expect(target.key).toMatch(/^[a-z][a-z0-9_.]*$/)
    }
  })

  it('hrefs are absolute paths starting with /', () => {
    for (const target of ADMIN_ROUTE_TARGETS) {
      expect(target.href.startsWith('/')).toBe(true)
    }
  })

  it('ROUTE_TARGET_KEYS set mirrors ADMIN_ROUTE_TARGETS', () => {
    expect(ROUTE_TARGET_KEYS.size).toBe(ADMIN_ROUTE_TARGETS.length)
    for (const t of ADMIN_ROUTE_TARGETS) {
      expect(ROUTE_TARGET_KEYS.has(t.key)).toBe(true)
    }
  })

  it('findRouteTargetByKey / findRouteTargetByHref resolve existing targets', () => {
    const overview = ADMIN_ROUTE_TARGETS.find((t) => t.key === 'overview')!
    expect(findRouteTargetByKey('overview')).toEqual(overview)
    expect(findRouteTargetByHref('/')).toEqual(overview)
    expect(findRouteTargetByKey('platform.feature_flags')?.href).toBe('/platform/feature-flags')
    expect(findRouteTargetByKey('not-exist')).toBeUndefined()
  })

  it('将每个中文和老挝语内容类别登记为独立路由目标', () => {
    const expected = new Map([
      ['content.zh.pinyin', '/content/zh/pinyin'],
      ['content.zh.syllables', '/content/zh/syllables'],
      ['content.zh.hanzi', '/content/zh/hanzi'],
      ['content.zh.words', '/content/zh/words'],
      ['content.zh.sentences', '/content/zh/sentences'],
      ['content.zh.review', '/content/zh/review'],
      ['content.lo.letters', '/content/lo/letters'],
      ['content.lo.syllables', '/content/lo/syllables'],
      ['content.lo.words', '/content/lo/words'],
      ['content.lo.sentences', '/content/lo/sentences'],
      ['content.lo.review', '/content/lo/review'],
    ])

    for (const [key, href] of expected) {
      expect(findRouteTargetByKey(key)?.href).toBe(href)
    }
  })
})
