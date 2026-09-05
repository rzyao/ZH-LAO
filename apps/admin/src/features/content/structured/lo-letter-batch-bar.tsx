import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LaoLetterSelectionState } from './lo-letter-selection'

export function LaoLetterSelectionBanner({
  state,
  total,
  allPageSelected,
  onUpgrade,
  upgrading = false,
  className,
}: {
  state: LaoLetterSelectionState
  total: number
  allPageSelected: boolean
  onUpgrade?: () => void
  upgrading?: boolean
  className?: string
}) {
  if (state.mode === 'none') return null
  if (state.mode === 'query_all') {
    return <div className={cn('flex items-center rounded-md border bg-muted/50 px-3 py-2 text-sm', className)} role="status">已选择当前查询全部 {state.expectedCount} 项</div>
  }
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm', className)} role="status">
      <span>已选择本页 {state.contentIds.length} 项</span>
      {allPageSelected && total > state.contentIds.length ? (
        <Button disabled={upgrading} onClick={onUpgrade} size="sm" variant="outline">
          选择当前查询全部 {total} 项
        </Button>
      ) : null}
    </div>
  )
}
