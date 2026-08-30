import * as React from 'react'
import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

/** Sortable column header used inside DataTable column definitions. */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const sorted = column.getIsSorted()

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 gap-1 px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(sorted === 'asc')}
        aria-label={`切换 ${title} 排序`}
      >
        <span>{title}</span>
        {sorted === 'desc' ? (
          <ArrowDown aria-hidden className="size-3.5" />
        ) : sorted === 'asc' ? (
          <ArrowUp aria-hidden className="size-3.5" />
        ) : (
          <ChevronsUpDown aria-hidden className="size-3.5 opacity-50" />
        )}
      </Button>
    </div>
  )
}
