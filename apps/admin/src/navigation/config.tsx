import type { LucideIcon } from 'lucide-react'
import {
  AudioLines,
  BookOpen,
  CircleUser,
  CreditCard,
  Database,
  FileText,
  Gift,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Users,
} from 'lucide-react'
import type { DomainName } from '@/auth/permissions'

export interface NavItem {
  key: string
  label: string
  href: string
  icon: LucideIcon
  /** Owning V2 Domain, when the item maps to one of the 11 Domains. */
  domain?: DomainName
  /** Placeholder until its Domain phase arrives. */
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

/** Domain-level navigation shown beside the primary sidebar. */
export const SECONDARY_NAV: SecondaryNavConfig[] = [
  {
    prefix: '/content',
    title: '内容管理',
    items: [
      { key: 'letters', label: '字母管理', href: '/content/letters', icon: BookOpen },
      { key: 'syllables', label: '音节管理', href: '/content/syllables', icon: BookOpen },
      { key: 'vocabulary', label: '词汇管理', href: '/content/vocabulary', icon: BookOpen },
      { key: 'sentences', label: '句子与例句', href: '/content/sentences', icon: BookOpen },
    ],
  },
  {
    prefix: '/operations',
    title: '运营权限',
    items: [
      { key: 'operators', label: '操作员管理', href: '/operations/operators', icon: Users },
      { key: 'roles', label: '角色与权限', href: '/operations/roles', icon: ShieldCheck },
      { key: 'audit-logs', label: '操作审计日志', href: '/operations/audit-logs', icon: FileText },
    ],
  },
  {
    prefix: '/platform',
    title: '平台控制台',
    items: [
      { key: 'feature-flags', label: '功能开关', href: '/platform/feature-flags', icon: SlidersHorizontal },
      { key: 'runtime-configs', label: '运行时配置', href: '/platform/runtime-configs', icon: Settings },
      { key: 'app-versions', label: '客户端版本', href: '/platform/app-versions', icon: Smartphone },
      { key: 'announcements', label: '全服与定向公告', href: '/platform/announcements', icon: MessageSquare },
      { key: 'regions', label: '支持地区', href: '/platform/regions', icon: Database },
    ],
  },
]

/**
 * Sidebar information architecture (frozen in ADMIN_FOUNDATION_PLAN §8).
 * All 11 Domains are present; there is NO standalone Community Domain.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: '总览',
    items: [
      { key: 'overview', label: '总览看板', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    key: 'learning-content',
    label: '学习与内容',
    items: [
      { key: 'content', label: '内容管理', href: '/content', icon: BookOpen, domain: 'content' },
      { key: 'learning', label: '学习系统', href: '/learning', icon: GraduationCap, domain: 'learning', placeholder: true },
      { key: 'audio', label: '音频生产', href: '/audio', icon: AudioLines, domain: 'audio', placeholder: true },
    ],
  },
  {
    key: 'users-community',
    label: '用户与社交',
    items: [
      { key: 'identity', label: '身份认证', href: '/identity', icon: CircleUser, domain: 'identity', placeholder: true },
      { key: 'social', label: '社交关系', href: '/social', icon: Users, domain: 'social', placeholder: true },
      { key: 'chat', label: '实时聊天', href: '/chat', icon: MessageSquare, domain: 'chat', placeholder: true },
    ],
  },
  {
    key: 'business',
    label: '商业与财务',
    items: [
      { key: 'commerce', label: '交易商城', href: '/commerce', icon: CreditCard, domain: 'commerce', placeholder: true },
      { key: 'rewards', label: '奖励中心', href: '/rewards', icon: Gift, domain: 'rewards', placeholder: true },
    ],
  },
  {
    key: 'safety',
    label: '安全治理',
    items: [
      { key: 'trust', label: '信任与风控', href: '/trust', icon: ShieldCheck, domain: 'trust', placeholder: true },
    ],
  },
  {
    key: 'system',
    label: '系统运维',
    items: [
      { key: 'operations', label: '运营权限', href: '/operations', icon: Settings, domain: 'operations' },
      { key: 'platform', label: '平台控制台', href: '/platform', icon: Database, domain: 'platform' },
    ],
  },
]

/** Development-only entries (design-system showcase). */
export const DEV_NAV_ITEMS: NavItem[] = [
  {
    key: 'design-system',
    label: '设计系统规范',
    href: '/system/design-system',
    icon: SlidersHorizontal,
  },
]

export function findNavItemByHref(href: string): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) => entry.href === href)
    if (item) return item
  }
  return DEV_NAV_ITEMS.find((entry) => entry.href === href)
}

export function allNavItems(): NavItem[] {
  return [...NAV_GROUPS.flatMap((group) => group.items), ...DEV_NAV_ITEMS]
}
