import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Debounced search input bound to `searchValue`. */
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /** Extra filter controls rendered between search and actions. */
  children?: React.ReactNode
  /** Reset filters button. */
  onReset?: () => void
  /** Disable every control (e.g. while loading). */
  disabled?: boolean
}

/**
 * Unified filter bar: search input + arbitrary filter controls + reset.
 * No Domain business is embedded; Domains provide their own controls via
 * `children`.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = '搜索…',
  children,
  onReset,
  disabled,
  className,
  ...props
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-b bg-card/40 px-5 py-2.5',
        className,
      )}
      {...props}
    >
      <div className="relative w-full max-w-xs">
        <Search aria-hidden className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={searchPlaceholder}
          value={searchValue ?? ''}
          onChange={(event) => onSearchChange?.(event.target.value)}
          disabled={disabled}
        />
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      {onReset ? (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={onReset}
          disabled={disabled}
        >
          <X aria-hidden className="size-3.5" />
          重置
        </Button>
      ) : null}
    </div>
  )
}
