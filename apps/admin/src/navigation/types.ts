import type { LucideIcon } from 'lucide-react'
import type { DomainName } from '@/auth/permissions'

/** 稳定路由目标(白名单单一事实源)。key 为 FR-015 要求的稳定标识。 */
export interface RouteTarget {
  key: string
  href: string
  label: string
  domain?: DomainName
}

/** 配置驱动导航项(由后端菜单树 normalize 而来或内置 fallback)。 */
export interface NavItem {
  key: string
  label: string
  href: string
  icon: LucideIcon
  routeKey?: string
  permissions?: readonly string[]
  iconKey?: string | null
  domain?: DomainName
  placeholder?: boolean
}

export interface NavGroup {
  key: string
  label: string
  items: NavItem[]
}

export interface SecondaryNav {
  key: string
  label: string
  href: string
  icon: LucideIcon
}

export interface SecondaryNavConfig {
  prefix: string
  title: string
  items: SecondaryNav[]
}

/** 后端菜单树节点(与 contracts/http-api.md 的嵌套树 DTO 对应)。 */
export interface MenuTreeNode {
  id: number
  label: string
  routeKey: string | null
  icon: string | null
  sortOrder: number
  status: 'active' | 'disabled' | 'removed'
  updatedAt: string
  permissions: readonly string[]
  children: readonly MenuTreeNode[]
}

export interface MenusResponse {
  groups: readonly MenuTreeNode[]
}
