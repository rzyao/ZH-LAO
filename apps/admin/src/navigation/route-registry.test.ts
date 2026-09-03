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
})
