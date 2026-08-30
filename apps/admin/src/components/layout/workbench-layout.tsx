import * as React from 'react'
import { cn } from '@/lib/utils'

export interface WorkbenchLayoutProps {
  /** Primary work area (e.g. queue / content). */
  primary: React.ReactNode
  /** Secondary side panel (e.g. inspector / detail). */
  aside?: React.ReactNode
  /** Optional third column. */
  third?: React.ReactNode
  className?: string
}

/**
 * Base workbench layout for complex workflow pages (Audio / Trust /
 * Operations arrive in later phases). Provides a two/three-column scaffold
 * only — no business logic is embedded.
 */
export function WorkbenchLayout({ primary, aside, third, className }: WorkbenchLayoutProps) {
  return (
    <div className={cn('flex h-full min-h-0 gap-px overflow-hidden', className)}>
      <div className="min-w-0 flex-1 overflow-auto">{primary}</div>
      {aside ? (
        <aside className="w-80 shrink-0 overflow-auto border-l bg-card/40">{aside}</aside>
      ) : null}
      {third ? (
        <div className="w-72 shrink-0 overflow-auto border-l bg-card/40">{third}</div>
      ) : null}
    </div>
  )
}
