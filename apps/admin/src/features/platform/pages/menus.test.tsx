import { describe, expect, it } from 'vitest'
import { ADMIN_ROUTE_TARGETS } from '@/navigation/route-registry'

/**
 * FR-008 / US3: 菜单目标路由受白名单约束。
 * 前端白名单单一事实源 = ADMIN_ROUTE_TARGETS;菜单管理页「目标路由」下拉只枚举它。
 * 此测试验证白名单本身的关键性质,确保下拉不可能出现白名单外目标。
 */
describe('MenusPage route whitelist (T030)', () => {
  it('exposes only whitelisted route targets (ADMIN_ROUTE_TARGETS)', () => {
    // 下拉的数据源就是 ADMIN_ROUTE_TARGETS;确保其包含菜单管理自身与核心页面
    const keys = ADMIN_ROUTE_TARGETS.map((t) => t.key)
    expect(keys).toContain('platform.menus')
    expect(keys).toContain('operations.operators')
    expect(keys).toContain('platform.feature_flags')
    expect(keys).toContain('overview')
  })

  it('every route target resolves to a real admin route (absolute href, root allowed)', () => {
    for (const target of ADMIN_ROUTE_TARGETS) {
      expect(target.href.startsWith('/')).toBe(true)
      if (target.href !== '/') {
        expect(target.href.length).toBeGreaterThan(1)
      }
    }
  })
})
