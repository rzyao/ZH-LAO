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
  /** Contextual controls that remain visible with the page introduction. */
  toolbar?: React.ReactNode
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
  toolbar,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn('sticky top-0 z-10 flex flex-col gap-3 border-b bg-card/95 px-4 py-4 backdrop-blur sm:px-8', className)} {...props}>
      {toolbar ? <div className="absolute inset-x-0 top-0 z-20 border-b bg-card/95 px-4 py-3 shadow-md backdrop-blur sm:px-8">{toolbar}</div> : null}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold leading-tight tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
