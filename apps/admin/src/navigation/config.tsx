import type { LucideIcon } from 'lucide-react'
import {
  AudioLines,
  BookOpen,
  CircleUser,
  CreditCard,
  Database,
  Gift,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
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

/**
 * Sidebar information architecture (frozen in ADMIN_FOUNDATION_PLAN §8).
 * All 11 Domains are present; there is NO standalone Community Domain.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: '总览',
    items: [
      { key: 'overview', label: 'Overview', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    key: 'learning-content',
    label: 'Learning Content',
    items: [
      { key: 'content', label: 'Content', href: '/content', icon: BookOpen, domain: 'content', placeholder: true },
      { key: 'learning', label: 'Learning', href: '/learning', icon: GraduationCap, domain: 'learning', placeholder: true },
      { key: 'audio', label: 'Audio Production', href: '/audio', icon: AudioLines, domain: 'audio', placeholder: true },
    ],
  },
  {
    key: 'users-community',
    label: 'Users & Community',
    items: [
      { key: 'identity', label: 'Identity', href: '/identity', icon: CircleUser, domain: 'identity', placeholder: true },
      { key: 'social', label: 'Social', href: '/social', icon: Users, domain: 'social', placeholder: true },
      { key: 'chat', label: 'Chat', href: '/chat', icon: MessageSquare, domain: 'chat', placeholder: true },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    items: [
      { key: 'commerce', label: 'Commerce', href: '/commerce', icon: CreditCard, domain: 'commerce', placeholder: true },
      { key: 'rewards', label: 'Rewards', href: '/rewards', icon: Gift, domain: 'rewards', placeholder: true },
    ],
  },
  {
    key: 'safety',
    label: 'Safety',
    items: [
      { key: 'trust', label: 'Trust & Safety', href: '/trust', icon: ShieldCheck, domain: 'trust', placeholder: true },
    ],
  },
  {
    key: 'system',
    label: 'System',
    items: [
      { key: 'operations', label: 'Operations', href: '/operations', icon: Settings, domain: 'operations', placeholder: true },
      { key: 'platform', label: 'Platform', href: '/platform', icon: Database, domain: 'platform' },
    ],
  },
]

/** Development-only entries (design-system showcase). */
export const DEV_NAV_ITEMS: NavItem[] = [
  {
    key: 'design-system',
    label: 'Design System',
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
