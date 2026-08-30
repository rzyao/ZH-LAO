import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * Generic low-decoration content card used by platform-level pages.
 * Not a marketing-style card — compact, border-based, no large radius.
 */
export function Card({ title, description, actions, children, className, ...props }: CardProps) {
  return (
    <section className={cn('rounded-md border bg-card', className)} {...props}>
      {title ? (
        <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <div>
            <h2 className="text-sm font-semibold leading-none">{title}</h2>
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn('p-4', !title && 'p-4')}>{children}</div>
    </section>
  )
}
