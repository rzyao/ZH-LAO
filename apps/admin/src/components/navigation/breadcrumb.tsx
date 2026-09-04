import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type { BreadcrumbItem } from '@/components/common/page-header'
import { useNavConfig } from '@/navigation/use-nav-config'
import type { NavItem } from '@/navigation/types'

function findPath(items: readonly NavItem[], pathname: string, ancestors: readonly NavItem[] = []): NavItem[] | null {
  for (const item of items) {
    const path = [...ancestors, item]
    if (item.href === pathname) return path
    const nested = findPath(item.children ?? [], pathname, path)
    if (nested) return nested
  }
  return null
}

/** Derive the current breadcrumb trail from the active route (config-driven nav). */
export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { nav } = useNavConfig()

  if (pathname === '/') {
    return [{ label: '总览' }]
  }

  const crumbs: BreadcrumbItem[] = [{ label: '总览', href: '/' }]
  const path = findPath(nav, pathname)
  if (!path) {
    crumbs.push({ label: pathname })
    return crumbs
  }
  for (const item of path) {
    if (item.href === '/') continue
    crumbs.push({ label: item.label, ...(item.href ? { href: item.href } : {}) })
  }
  return crumbs
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="面包屑" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground/50" />
              ) : null}
              {item.href && !isLast ? (
                <Link to={item.href} className="shrink-0 truncate transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'truncate font-medium text-foreground' : 'truncate'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
