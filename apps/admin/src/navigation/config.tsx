import {
  AudioLines,
  BookOpen,
  CircleUser,
  CreditCard,
  Database,
  FileText,
  Folder,
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
import type { NavItem } from './types'

/**
 * 菜单加载失败时使用的安全默认目录树。
 * 节点只有「可选路由 + 可选子节点」，不再区分分组、一级菜单和二级菜单。
 */
export const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: '总览看板', href: '/', icon: LayoutDashboard, children: [] },
  {
    key: 'learning-content', label: '学习与内容', icon: Folder, children: [
      {
        key: 'content', label: '内容管理', href: '/content', icon: BookOpen, domain: 'content', children: [
          {
            key: 'zh', label: '中文内容', icon: Folder, children: [
              { key: 'zh-pinyin', label: '拼音管理', href: '/content/zh/pinyin', icon: BookOpen, children: [] },
              { key: 'zh-syllables', label: '中文音节管理', href: '/content/zh/syllables', icon: BookOpen, children: [] },
              { key: 'zh-hanzi', label: '汉字管理', href: '/content/zh/hanzi', icon: BookOpen, children: [] },
              { key: 'zh-words', label: '词语管理', href: '/content/zh/words', icon: BookOpen, children: [] },
              { key: 'zh-sentences', label: '句子管理', href: '/content/zh/sentences', icon: BookOpen, children: [] },
              { key: 'zh-review', label: '审核与发布', href: '/content/zh/review', icon: ShieldCheck, children: [] },
            ],
          },
          {
            key: 'lo', label: '老挝语内容', icon: Folder, children: [
              { key: 'lo-letters', label: '字母管理', href: '/content/lo/letters', icon: BookOpen, children: [] },
              { key: 'lo-syllables', label: '音节管理', href: '/content/lo/syllables', icon: BookOpen, children: [] },
              { key: 'lo-words', label: '词语管理', href: '/content/lo/words', icon: BookOpen, children: [] },
              { key: 'lo-sentences', label: '句子管理', href: '/content/lo/sentences', icon: BookOpen, children: [] },
              { key: 'lo-review', label: '审核与发布', href: '/content/lo/review', icon: ShieldCheck, children: [] },
            ],
          },
          { key: 'courses', label: '课程管理', href: '/content/courses', icon: GraduationCap, children: [] },
        ],
      },
      { key: 'learning', label: '学习系统', href: '/learning', icon: GraduationCap, domain: 'learning', placeholder: true, children: [] },
      { key: 'audio', label: '音频生产', href: '/audio', icon: AudioLines, domain: 'audio', placeholder: true, children: [] },
    ],
  },
  {
    key: 'users-community', label: '用户与社交', icon: Folder, children: [
      { key: 'identity', label: '身份认证', href: '/identity', icon: CircleUser, domain: 'identity', placeholder: true, children: [] },
      { key: 'social', label: '社交关系', href: '/social', icon: Users, domain: 'social', placeholder: true, children: [] },
      { key: 'chat', label: '实时聊天', href: '/chat', icon: MessageSquare, domain: 'chat', placeholder: true, children: [] },
    ],
  },
  {
    key: 'business', label: '商业与财务', icon: Folder, children: [
      { key: 'commerce', label: '交易商城', href: '/commerce', icon: CreditCard, domain: 'commerce', placeholder: true, children: [] },
      { key: 'rewards', label: '奖励中心', href: '/rewards', icon: Gift, domain: 'rewards', placeholder: true, children: [] },
    ],
  },
  {
    key: 'safety', label: '安全治理', icon: Folder, children: [
      { key: 'trust', label: '信任与风控', href: '/trust', icon: ShieldCheck, domain: 'trust', placeholder: true, children: [] },
    ],
  },
  {
    key: 'system', label: '系统运维', icon: Folder, children: [
      {
        key: 'operations', label: '运营权限', href: '/operations', icon: Settings, domain: 'operations', children: [
          { key: 'operators', label: '操作员管理', href: '/operations/operators', icon: Users, children: [] },
          { key: 'roles', label: '角色与权限', href: '/operations/roles', icon: ShieldCheck, children: [] },
          { key: 'audit-logs', label: '操作审计日志', href: '/operations/audit-logs', icon: FileText, children: [] },
        ],
      },
      {
        key: 'platform', label: '平台控制台', href: '/platform', icon: Database, domain: 'platform', children: [
          { key: 'feature-flags', label: '功能开关', href: '/platform/feature-flags', icon: SlidersHorizontal, children: [] },
          { key: 'runtime-configs', label: '运行时配置', href: '/platform/runtime-configs', icon: Settings, children: [] },
          { key: 'app-versions', label: '客户端版本', href: '/platform/app-versions', icon: Smartphone, children: [] },
          { key: 'announcements', label: '全服与定向公告', href: '/platform/announcements', icon: MessageSquare, children: [] },
          { key: 'regions', label: '支持地区', href: '/platform/regions', icon: Database, children: [] },
          { key: 'menus', label: '菜单管理', href: '/platform/menus', icon: Settings, children: [] },
        ],
      },
    ],
  },
]

/** 开发环境专用入口。 */
export const DEV_NAV_ITEMS: NavItem[] = [
  { key: 'design-system', label: '设计系统规范', href: '/system/design-system', icon: SlidersHorizontal, children: [] },
]

function flatten(items: readonly NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])])
}

export function findNavItemByHref(href: string): NavItem | undefined {
  return [...flatten(NAV_ITEMS), ...DEV_NAV_ITEMS].find((item) => item.href === href)
}

export function allNavItems(): NavItem[] {
  return [...flatten(NAV_ITEMS), ...DEV_NAV_ITEMS]
}
