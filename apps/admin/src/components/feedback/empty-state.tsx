import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  /** Primary action. */
  action?: React.ReactNode
  /** Secondary action. */
  secondaryAction?: React.ReactNode
  className?: string
}

/** Unified empty state with optional actions. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-5" />
      </div>
      <h3 className="mt-1 text-sm font-medium">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {(action || secondaryAction) && (
        <div className="mt-2 flex items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

/** Convenience button for empty-state primary actions. */
export function EmptyStateAction({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button size="sm" {...props}>
      {children}
    </Button>
  )
}
