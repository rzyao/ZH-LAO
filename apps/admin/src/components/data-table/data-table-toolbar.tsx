import * as React from 'react'
import { cn } from '@/lib/utils'

interface DataTableToolbarProps {
  children?: React.ReactNode
  className?: string
}

/** Toolbar container rendered above the table (filters / actions). */
export function DataTableToolbar({ children, className }: DataTableToolbarProps) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
}
