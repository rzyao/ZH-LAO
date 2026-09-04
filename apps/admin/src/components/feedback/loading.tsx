import { LoaderCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Full-page loading state. */
export function PageLoading({ label = '加载中…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full min-h-[40vh] w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <LoaderCircle aria-hidden className="size-6 animate-spin" />
      <span>{label}</span>
    </div>
  )
}

/** Loading rows shown inside a table body. */
export function TableLoading({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <tbody aria-busy="true" data-testid="table-loading">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

/** Small inline spinner. */
export function InlineLoading({ label, className }: { label?: string; className?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground', className)}
    >
      <LoaderCircle aria-hidden className="size-4 animate-spin" />
      {label ? <span>{label}</span> : null}
    </span>
  )
}

/** Loader to embed inside a Button — use the `Button loading` prop. */
