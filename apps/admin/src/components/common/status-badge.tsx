import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/**
 * Unified status colors (frozen in ADMIN_FOUNDATION_PLAN §12):
 * - success  → green  : active / published / succeeded
 * - warning  → yellow : pending / in progress
 * - danger   → red    : failed / blocked / destructive
 * - info     → blue   : processing / informational
 * - muted    → gray   : inactive / archived
 *
 * Every status carries a text or icon label — color is never the only signal.
 */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'muted'

export interface StatusBadgeProps {
  tone: StatusTone
  /** Text label. Always required so color is never the only signal. */
  label: string
  /** Show a small leading dot. */
  dot?: boolean
  className?: string
}

const dotClass: Record<StatusTone, string> = {
  success: 'bg-current',
  warning: 'bg-current',
  danger: 'bg-current',
  info: 'bg-current',
  muted: 'bg-current',
}

const badgeVariantByTone: Record<
  StatusTone,
  'success' | 'warning' | 'destructive' | 'info' | 'muted'
> = {
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  info: 'info',
  muted: 'muted',
}

export function StatusBadge({ tone, label, dot = true, className }: StatusBadgeProps) {
  return (
    <Badge variant={badgeVariantByTone[tone]} className={cn('whitespace-nowrap', className)}>
      {dot ? <span aria-hidden className={cn('size-1.5 rounded-full', dotClass[tone])} /> : null}
      {label}
    </Badge>
  )
}

export { StatusBadge as StatusPill }
