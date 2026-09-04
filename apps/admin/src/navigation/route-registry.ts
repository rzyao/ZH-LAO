import type { RouteTarget } from './types'

/**
 * Admin 路由目标白名单 —— 单一事实源(ADR-022 §6)。
 * 同时被 router.tsx 用于生成路由、被菜单管理页「目标路由」下拉框消费、
 * 被后端 MENU_ROUTE_TARGET_KEYS 镜像(仅 key)。
 */
export const ADMIN_ROUTE_TARGETS: readonly RouteTarget[] = [
  { key: 'overview', href: '/', label: '总览看板' },
  { key: 'content', href: '/content', label: '内容管理', domain: 'content' },
  { key: 'learning', href: '/learning', label: '学习系统', domain: 'learning' },
  { key: 'audio', href: '/audio', label: '音频生产', domain: 'audio' },
  { key: 'identity', href: '/identity', label: '身份认证', domain: 'identity' },
  { key: 'social', href: '/social', label: '社交关系', domain: 'social' },
  { key: 'chat', href: '/chat', label: '实时聊天', domain: 'chat' },
  { key: 'commerce', href: '/commerce', label: '交易商城', domain: 'commerce' },
  { key: 'rewards', href: '/rewards', label: '奖励中心', domain: 'rewards' },
  { key: 'trust', href: '/trust', label: '信任与风控', domain: 'trust' },
  { key: 'operations', href: '/operations', label: '运营权限', domain: 'operations' },
  { key: 'platform', href: '/platform', label: '平台控制台', domain: 'platform' },
  { key: 'content.letters', href: '/content/letters', label: '字母管理', domain: 'content' },
  { key: 'content.syllables', href: '/content/syllables', label: '音节管理', domain: 'content' },
  { key: 'content.vocabulary', href: '/content/vocabulary', label: '词汇管理', domain: 'content' },
  { key: 'content.sentences', href: '/content/sentences', label: '句子与例句', domain: 'content' },
  { key: 'operations.operators', href: '/operations/operators', label: '操作员管理', domain: 'operations' },
  { key: 'operations.roles', href: '/operations/roles', label: '角色与权限', domain: 'operations' },
  { key: 'operations.audit_logs', href: '/operations/audit-logs', label: '操作审计日志', domain: 'operations' },
  { key: 'platform.feature_flags', href: '/platform/feature-flags', label: '功能开关', domain: 'platform' },
  { key: 'platform.runtime_configs', href: '/platform/runtime-configs', label: '运行时配置', domain: 'platform' },
  { key: 'platform.app_versions', href: '/platform/app-versions', label: '客户端版本', domain: 'platform' },
  { key: 'platform.announcements', href: '/platform/announcements', label: '全服与定向公告', domain: 'platform' },
  { key: 'platform.regions', href: '/platform/regions', label: '支持地区', domain: 'platform' },
  { key: 'platform.menus', href: '/platform/menus', label: '菜单管理', domain: 'platform' },
  { key: 'change_password', href: '/change-password', label: '修改密码' },
  { key: 'account.change_password', href: '/account/change-password', label: '修改密码(账户)' },
]

export const ROUTE_TARGET_KEYS: ReadonlySet<string> = new Set(
  ADMIN_ROUTE_TARGETS.map((t) => t.key),
)

/** 按 key 查找路由目标(菜单渲染时 route_key → href)。 */
export function findRouteTargetByKey(key: string): RouteTarget | undefined {
  return ADMIN_ROUTE_TARGETS.find((t) => t.key === key)
}

/** 按 href 查找路由目标(激活态/面包屑用)。 */
export function findRouteTargetByHref(href: string): RouteTarget | undefined {
  return ADMIN_ROUTE_TARGETS.find((t) => t.href === href)
}
