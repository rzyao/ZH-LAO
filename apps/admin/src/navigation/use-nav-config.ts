import { useMemo } from 'react'
import { useAuth } from '@/auth/context/AuthContext'
import { useMenusQuery } from '@/features/platform/menus-queries'
import { findRouteTargetByKey } from './route-registry'
import { resolveIcon } from './icon-registry'
import { NAV_ITEMS } from './config'
import type { MenuTreeNode, NavItem } from './types'
import type { Permission } from '@/auth/permissions'

/** 配置驱动的统一递归目录树。 */
export interface NavConfig {
  nav: NavItem[]
  source: 'remote' | 'fallback'
}

function isVisible(itemPermissions: readonly string[] | undefined, can: (permission: string) => boolean): boolean {
  if (!itemPermissions || itemPermissions.length === 0) return true
  return itemPermissions.some((permission) => can(permission))
}

function toNavItem(node: MenuTreeNode, can: (permission: string) => boolean): NavItem | null {
  if (node.status !== 'active' || !isVisible(node.permissions, can)) return null
  const target = node.routeKey ? findRouteTargetByKey(node.routeKey) : undefined
  const children = node.children
    .map((child) => toNavItem(child, can))
    .filter((child): child is NavItem => child !== null)

  // 无可用路由且没有可见子节点的空目录不占用侧边栏空间。
  if (!target && children.length === 0) return null

  return {
    key: String(node.id),
    label: node.label,
    ...(target ? { href: target.href, domain: target.domain } : {}),
    icon: resolveIcon(node.icon),
    routeKey: node.routeKey ?? undefined,
    permissions: node.permissions,
    iconKey: node.icon,
    children,
  }
}

/** 后端任意深度菜单树直接映射为同构目录树，不再推导分组或二级导航。 */
export function normalizeToNav(nodes: readonly MenuTreeNode[], can: (permission: string) => boolean): NavConfig {
  return {
    nav: nodes.map((node) => toNavItem(node, can)).filter((node): node is NavItem => node !== null),
    source: 'remote',
  }
}

const FALLBACK_NAV: NavConfig = { nav: NAV_ITEMS, source: 'fallback' }

export function useNavConfig(): NavConfig {
  const { can, status } = useAuth()
  const menusQuery = useMenusQuery({ enabled: status === 'authenticated' })

  return useMemo(() => {
    if (menusQuery.isError) return FALLBACK_NAV
    const nodes = menusQuery.data
    if (!nodes || nodes.length === 0) return FALLBACK_NAV
    return normalizeToNav(nodes, (permission) => can(permission as Permission))
  }, [menusQuery.isError, menusQuery.data, can])
}
