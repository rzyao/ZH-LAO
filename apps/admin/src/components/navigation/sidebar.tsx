import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { DEV_NAV_ITEMS, NAV_GROUPS } from '@/navigation/config'
import type { NavItem } from '@/navigation/config'
import { env } from '@/app/config'
import { cn } from '@/lib/utils'

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarItem({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem
  collapsed: boolean
  pathname: string
}) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      className={cn(
        'flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors',
        active
          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        collapsed && 'justify-center px-0',
      )}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const groups = env.enableDesignSystem
    ? [...NAV_GROUPS]
    : NAV_GROUPS

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'flex h-full shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-150',
        collapsed ? 'w-12' : 'w-56',
      )}
    >
      <div className={cn('flex h-12 items-center border-b border-sidebar-border px-2', collapsed && 'justify-center px-0')}>
        {!collapsed ? (
          <div className="flex min-w-0 items-center gap-2 px-1">
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              ZL
            </span>
            <span className="truncate text-sm font-semibold">ZH-LAO 控制台</span>
          </div>
        ) : (
          <span className="flex size-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
            ZL
          </span>
        )}
        <button
          type="button"
          className={cn(
            'ml-auto rounded p-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'ml-0',
          )}
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="size-4" />
          ) : (
            <PanelLeftClose aria-hidden className="size-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto p-2" aria-label="主导航">
        {groups.map((group) => (
          <div key={group.key}>
            {!collapsed ? (
              <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/50">
                {group.label}
              </div>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.key} item={item} collapsed={collapsed} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}

        {env.enableDesignSystem ? (
          <div>
            {!collapsed ? (
              <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/50">
                开发辅助
              </div>
            ) : null}
            <div className="space-y-0.5">
              {DEV_NAV_ITEMS.map((item) => (
                <SidebarItem key={item.key} item={item} collapsed={collapsed} pathname={pathname} />
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="flex h-11 items-center gap-2 border-t border-sidebar-border px-3">
        <ChevronLeft aria-hidden className="size-4 text-sidebar-foreground/50" />
        <span className="truncate text-xs text-sidebar-foreground/70">
          {collapsed ? '' : '管理后台基础框架'}
        </span>
      </div>
    </aside>
  )
}
