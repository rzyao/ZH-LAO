import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  /** Primary/secondary action buttons rendered on the right. */
  actions?: React.ReactNode
}

/**
 * Standard page header used by every page pattern: breadcrumb, title,
 * description and right-aligned actions.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2 border-b bg-card/60 px-5 py-3.5', className)} {...props}>
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="面包屑" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumb.map((item, index) => (
              <li key={index} className="flex items-center gap-1">
                {index > 0 ? <span aria-hidden className="text-muted-foreground/50">/</span> : null}
                {item.href ? (
                  <a href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </a>
                ) : (
                  <span className="text-foreground">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold leading-6 tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
