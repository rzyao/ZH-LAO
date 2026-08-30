import type { Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface RowAction<TData> {
  label: string
  onClick: (row: Row<TData>) => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  actions: RowAction<TData>[]
}

/**
 * Row actions menu bound to a TanStack Table row. Domain phases pass their
 * own action lists; the Foundation only provides the mechanism.
 */
export function DataTableRowActions<TData>({ row, actions }: DataTableRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="行操作">
            <MoreHorizontal aria-hidden className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            disabled={action.disabled}
            className={
              action.variant === 'destructive'
                ? 'text-destructive focus:text-destructive data-[highlighted]:text-destructive'
                : ''
            }
            onClick={() => action.onClick(row)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
