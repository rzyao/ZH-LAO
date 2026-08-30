import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  children: React.ReactNode
}

/**
 * Visual grouping of related form fields (compact, card-like but low
 * decoration). Used by Edit Page patterns.
 */
export function FormSection({ title, description, children, className, ...props }: FormSectionProps) {
  return (
    <section
      className={cn('space-y-3.5 rounded-md border bg-card/40 p-4', className)}
      {...props}
    >
      {title ? (
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium leading-none">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  )
}
