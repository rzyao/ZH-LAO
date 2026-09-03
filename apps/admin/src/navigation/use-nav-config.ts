import { useMemo } from 'react'
import { useAuth } from '@/auth/context/AuthContext'
import { useMenusQuery } from '@/features/platform/menus-queries'
import { findRouteTargetByKey } from './route-registry'
import { resolveIcon } from './icon-registry'
import { NAV_GROUPS, SECONDARY_NAV } from './config'
import type { NavGroup, NavItem, MenuTreeNode, SecondaryNavConfig } from './types'

/**
 * 配置驱动导航(ADR-022 §9 / FR-009 / FR-012)。
 * 成功:后端菜单树 → normalize + 权限过滤(OR);
 * 失败/空树:回退内置 NAV_GROUPS / SECONDARY_NAV(安全默认,绝不白屏)。
 * 空树时最小导航(总览 + 退出 + 菜单管理入口)由 Sidebar 在 fallback 上叠加。
 */
export interface NavConfig {
  /** 分组 → 一级项(侧边栏主结构)。 */
  nav: NavGroup[]
  /** 二级导航(prefix → items);配置驱动的层级已在 nav 中表达,secondary 用于兼容。 */
  secondary: SecondaryNavConfig[]
  /** 数据来源。 */
  source: 'remote' | 'fallback'
}

function isVisible(itemPermissions: readonly string[] | undefined, can: (permission: string) => boolean): boolean {
  if (!itemPermissions || itemPermissions.length === 0) return true
  return itemPermissions.some((p) => can(p))
}

function toNavItem(node: MenuTreeNode, can: (permission: string) => boolean): NavItem | null {
  if (!isVisible(node.permissions, can)) return null
  const target = node.routeKey ? findRouteTargetByKey(node.routeKey) : undefined
  const href = target?.href ?? '#'
  return {
    key: String(node.id),
    label: node.label,
    href,
    icon: resolveIcon(node.icon),
    routeKey: node.routeKey ?? undefined,
    permissions: node.permissions,
    iconKey: node.icon,
  }
}

/** 把后端树映射为 nav 结构;任一权限命中(OR)保留,空列表保留。 */
export function normalizeToNav(groups: readonly MenuTreeNode[], can: (permission: string) => boolean): NavConfig {
  const nav: NavGroup[] = []
  const secondary: SecondaryNavConfig[] = []

  // 第一遍:按分组收集各自一级项的 href(用于识别「容器分组」)。
  // 容器分组 = 顶层分组自身有可导航 routeKey,且该 href 已由别的分组的一级项提供。
  // 例:DB id=7 "内容管理"(routeKey:"content") → /content 已由 id=20("学习与内容"下的一级项)提供,
  //     故 id=7 仅贡献 secondary(字母管理等),不重复渲染为新的分组。
  const hrefsByGroup = new Map<string, Set<string>>()
  for (const group of groups) {
    const hrefs = new Set<string>()
    for (const child of group.children) {
      if (child.routeKey) {
        const t = findRouteTargetByKey(child.routeKey)
        if (t) hrefs.add(t.href)
      }
    }
    hrefsByGroup.set(String(group.id), hrefs)
  }

  for (const group of groups) {
    const groupTarget = group.routeKey ? findRouteTargetByKey(group.routeKey) : undefined

    // 容器分组:自身 href 在其它分组的一级项中出现 → 仅注册 secondary,不新建 NavGroup。
    if (groupTarget && group.children.length > 0) {
      const ownHrefs = hrefsByGroup.get(String(group.id)) ?? new Set<string>()
      const providedElsewhere = [...hrefsByGroup.entries()].some(
        ([key, hrefs]) => key !== String(group.id) && hrefs.has(groupTarget.href),
      )
      if (providedElsewhere) {
        const subItems = group.children
          .map((c) => toNavItem(c, can))
          .filter((x): x is NavItem => x !== null)
        if (subItems.length > 0) {
          secondary.push({
            prefix: groupTarget.href,
            title: group.label,
            items: subItems,
          })
        }
        continue
      }
    }

    const children = group.children
      .map((child) => toNavItem(child, can))
      .filter((x): x is NavItem => x !== null)
    if (children.length === 0 && !groupTarget) continue

    const groupItem: NavItem | null = group.routeKey && groupTarget
      ? toNavItem({ ...group, children: [] }, can)
      : null

    // 顶层分组渲染为 NavGroup;一级项为其 items
    nav.push({
      key: String(group.id),
      label: group.label,
      items: children,
    })

    // 若分组自身有可导航路由(如 内容管理 → /content),保留
    if (groupItem && groupItem.routeKey && children.length === 0) {
      nav[nav.length - 1]!.items = [groupItem]
    }

    // 二级项:若某个一级项自身有子项,生成 secondary 配置
    for (const child of group.children) {
      if (child.children.length > 0) {
        const childTarget = findRouteTargetByKey(child.routeKey ?? '')
        if (childTarget) {
          const subItems = child.children
            .map((c) => toNavItem(c, can))
            .filter((x): x is NavItem => x !== null)
          secondary.push({
            prefix: childTarget.href,
            title: child.label,
            items: subItems,
          })
        }
      }
    }
  }

  return { nav, secondary, source: 'remote' }
}

/** 内置安全默认(FR-009):fetch 失败/空树时回退。 */
const FALLBACK_NAV: NavConfig = { nav: NAV_GROUPS, secondary: SECONDARY_NAV, source: 'fallback' }

export function useNavConfig(): NavConfig {
  const { can, status } = useAuth()
  const menusQuery = useMenusQuery({ enabled: status === 'authenticated' })

  return useMemo(() => {
    if (menusQuery.isError) return FALLBACK_NAV
    const groups = menusQuery.data
    if (!groups || groups.length === 0) return FALLBACK_NAV
    // normalizeToNav 已完整处理所有 secondary:
    // - 一级项自身的 children(运营权限/平台控制台等)
    // - 顶层「容器分组」(routeKey=content 的内容管理),其子项经权限过滤后注册为 secondary
    // 因此这里直接返回,不再合并静态 SECONDARY_NAV(它无权限过滤,可能泄露无权菜单)。
    return normalizeToNav(groups, can)
  }, [menusQuery.isError, menusQuery.data, can])
}
