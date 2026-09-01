import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type { BreadcrumbItem } from '@/components/common/page-header'
import { findNavItemByHref, NAV_GROUPS } from '@/navigation/config'

/** Derive the current breadcrumb trail from the active route. */
export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (pathname === '/') {
    return [{ label: '总览' }]
  }

  const item = findNavItemByHref(pathname)
  const crumbs: BreadcrumbItem[] = [{ label: '总览', href: '/' }]
  if (!item) {
    crumbs.push({ label: pathname })
    return crumbs
  }
  const group = NAV_GROUPS.find((g) => g.items.some((entry) => entry.key === item.key))
  if (group) crumbs.push({ label: group.label })
  crumbs.push({ label: item.label })
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
