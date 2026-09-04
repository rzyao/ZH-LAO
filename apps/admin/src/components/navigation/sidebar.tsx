import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown, ChevronLeft, MenuSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { DEV_NAV_ITEMS } from '@/navigation/config'
import { useNavConfig } from '@/navigation/use-nav-config'
import { useAuth } from '@/auth/context/AuthContext'
import type { NavItem } from '@/navigation/types'
import { env } from '@/app/config'
import { cn } from '@/lib/utils'

function isActive(pathname: string, href: string | undefined): boolean {
  if (!href) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function hasActiveDescendant(pathname: string, item: NavItem): boolean {
  return (item.children ?? []).some((child) => isActive(pathname, child.href) || hasActiveDescendant(pathname, child))
}

function itemRowClass(active: boolean, collapsed: boolean): string {
  return cn(
    'flex h-9 min-w-0 items-center gap-2 rounded-md border-l-2 border-transparent px-3 text-sm transition-colors',
    active
      ? 'border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
    collapsed && 'justify-center px-0',
  )
}

/** 统一递归目录节点；任意节点都可带路由、带子项，或同时具备两者。 */
function SidebarNode({ item, collapsed, pathname }: { item: NavItem; collapsed: boolean; pathname: string }) {
  const children = item.children ?? []
  const hasChildren = children.length > 0
  const active = isActive(pathname, item.href)
  const branchActive = active || hasActiveDescendant(pathname, item)
  const [open, setOpen] = React.useState(false)
  const expanded = !collapsed && hasChildren && open
  const combinedNavigableDirectory = Boolean(item.href && hasChildren && !collapsed)
  const Icon = item.icon

  const labelContent = (
    <>
      <Icon aria-hidden className="size-4 shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </>
  )

  return (
    <div>
      <div
        className={cn(
          'flex min-w-0 items-center gap-0.5',
          combinedNavigableDirectory && itemRowClass(active, false),
          combinedNavigableDirectory && 'gap-0 px-0',
        )}
      >
        {item.href ? (
          <Link
            to={item.href}
            onClick={() => {
              if (hasChildren && !collapsed) setOpen((value) => !value)
            }}
            className={cn(
              combinedNavigableDirectory
                ? 'flex h-full min-w-0 flex-1 items-center gap-2 px-3'
                : itemRowClass(active, collapsed),
              !combinedNavigableDirectory && 'min-w-0 flex-1',
            )}
            aria-current={active ? 'page' : undefined}
            aria-expanded={hasChildren && !collapsed ? expanded : undefined}
            title={collapsed ? item.label : undefined}
          >
            {labelContent}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => hasChildren && setOpen((value) => !value)}
            className={cn(itemRowClass(branchActive, collapsed), 'min-w-0 flex-1')}
            aria-expanded={hasChildren ? expanded : undefined}
            title={collapsed ? item.label : undefined}
          >
            {labelContent}
            {!collapsed && hasChildren ? (
              <ChevronDown aria-hidden className={cn('ml-auto size-3.5 shrink-0 transition-transform', expanded && 'rotate-180')} />
            ) : null}
          </button>
        )}

        {item.href && hasChildren && !collapsed ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-full w-8 shrink-0 items-center justify-center rounded-r-md text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
            aria-label={`${expanded ? '收起' : '展开'} ${item.label}`}
            aria-expanded={expanded}
          >
            <ChevronDown aria-hidden className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
          {children.map((child) => (
            <SidebarNode key={child.key} item={child} collapsed={false} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** 配置被清空或读取失败时保留菜单管理入口，避免管理员被困。 */
function MinimalMenuEntry({ collapsed }: { collapsed: boolean }) {
  const { can } = useAuth()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (!can('platform.menus.read')) return null
  const active = isActive(pathname, '/platform/menus')
  return (
    <Link
      to="/platform/menus"
      className={itemRowClass(active, collapsed)}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? '菜单管理' : undefined}
    >
      <MenuSquare aria-hidden className="size-4 shrink-0" />
      {!collapsed ? <span className="truncate">菜单管理</span> : null}
    </Link>
  )
}

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { nav, source } = useNavConfig()
  const { can } = useAuth()
  const showMinimalEntry = source === 'fallback' && can('platform.menus.read')

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'h-full shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        mobile ? 'flex w-60' : 'hidden md:flex',
        !mobile && (collapsed ? 'w-16' : 'w-60'),
      )}
    >
      <div className={cn('flex h-12 items-center border-b border-sidebar-border px-2', !mobile && collapsed && 'justify-center px-0')}>
        {!collapsed || mobile ? (
          <div className="flex min-w-0 items-center gap-2 px-1">
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">ZL</span>
            <span className="truncate text-sm font-semibold">ZH-LAO 控制台</span>
          </div>
        ) : (
          <span className="flex size-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">ZL</span>
        )}
        <button
          type="button"
          className={cn(
            'ml-auto rounded p-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
            !mobile && collapsed && 'ml-0',
          )}
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? <PanelLeftOpen aria-hidden className="size-4" /> : <PanelLeftClose aria-hidden className="size-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="主导航">
        {nav.map((item) => (
          <SidebarNode key={item.key} item={item} collapsed={!mobile && collapsed} pathname={pathname} />
        ))}

        {showMinimalEntry ? <MinimalMenuEntry collapsed={!mobile && collapsed} /> : null}

        {env.enableDesignSystem
          ? DEV_NAV_ITEMS.map((item) => <SidebarNode key={item.key} item={item} collapsed={!mobile && collapsed} pathname={pathname} />)
          : null}
      </nav>

      <div className="flex h-11 items-center gap-2 border-t border-sidebar-border px-3">
        <ChevronLeft aria-hidden className="size-4 text-sidebar-foreground/50" />
        <span className="truncate text-xs text-sidebar-foreground/70">{!mobile && collapsed ? '' : '管理后台基础框架'}</span>
      </div>
    </aside>
  )
}
