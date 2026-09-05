import type { ComponentType } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { normalizeLaoLetterSearch } from './contracts'

const selectionModulePath = './lo-letter-selection'
type SelectionState =
  | Readonly<{ mode: 'none' }>
  | Readonly<{ mode: 'page_ids'; contentIds: readonly string[] }>
  | Readonly<{ mode: 'query_all'; expectedCount: number; selectionHash: string }>
type SelectionModule = Readonly<{
  createPageSelection: (contentIds: readonly string[]) => SelectionState
  upgradeToQueryAll: (state: SelectionState, preview: Readonly<{ expectedCount: number; selectionHash: string }>, allPageSelected: boolean) => SelectionState
  invalidateSelectionForQueryChange: (state: SelectionState, previousQuery: unknown, nextQuery: unknown) => SelectionState
  isCurrentPageFullySelected: (state: SelectionState, currentPageIds: readonly string[], rowSelection: Readonly<Record<string, boolean>>) => boolean
}>
type BatchBarModule = Readonly<{
  LaoLetterSelectionBanner: ComponentType<{ state: SelectionState; total: number; allPageSelected: boolean }>
}>
const loadSelectionModule = () => import(/* @vite-ignore */ selectionModulePath) as Promise<SelectionModule>
const loadBatchBarModule = () => import('./lo-letter-batch-bar') as Promise<BatchBarModule>

const ids = [
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
] as const

describe('Lao-letter explicit query-all selection', () => {
  it('starts with stable page content_ids and upgrades only through an explicit preview', async () => {
    const { createPageSelection, upgradeToQueryAll } = await loadSelectionModule()
    const pageSelection = createPageSelection(ids)
    expect(pageSelection).toEqual({ mode: 'page_ids', contentIds: ids })

    expect(upgradeToQueryAll(pageSelection, {
      expectedCount: 126,
      selectionHash: 'a'.repeat(64),
    }, true)).toEqual({ mode: 'query_all', expectedCount: 126, selectionHash: 'a'.repeat(64) })
    expect(upgradeToQueryAll(pageSelection, {
      expectedCount: 126,
      selectionHash: 'a'.repeat(64),
    }, false)).toEqual(pageSelection)
  })

  it('offers query-all only after the whole current page is selected', async () => {
    const { LaoLetterSelectionBanner } = await loadBatchBarModule()
    const partial = render(<LaoLetterSelectionBanner state={{ mode: 'page_ids', contentIds: ids.slice(0, 1) }} total={126} allPageSelected={false} />)
    expect(screen.queryByRole('button', { name: '选择当前查询全部 126 项' })).not.toBeInTheDocument()
    partial.unmount()
    const page = render(<LaoLetterSelectionBanner state={{ mode: 'page_ids', contentIds: ids }} total={126} allPageSelected />)
    expect(screen.getByRole('status')).toHaveTextContent('已选择本页 2 项')
    expect(screen.getByRole('button', { name: '选择当前查询全部 126 项' })).toBeEnabled()
    page.unmount()

    render(<LaoLetterSelectionBanner state={{ mode: 'query_all', expectedCount: 126, selectionHash: 'a'.repeat(64) }} total={126} allPageSelected={false} />)
    expect(screen.getByRole('status')).toHaveTextContent('已选择当前查询全部 126 项')
  })

  it('does not treat an equally sized selection from another page as the current page selection', async () => {
    const { createPageSelection, isCurrentPageFullySelected } = await loadSelectionModule()
    const previousPage = createPageSelection(ids)
    const currentPageIds = [
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002',
    ]
    expect(isCurrentPageFullySelected(previousPage, currentPageIds, { [ids[0]]: true, [ids[1]]: true })).toBe(false)
    expect(isCurrentPageFullySelected(previousPage, ids, { [ids[0]]: true, [ids[1]]: true })).toBe(true)
  })

  it('invalidates page and query-all selection synchronously when the target query changes', async () => {
    const { invalidateSelectionForQueryChange } = await loadSelectionModule()
    const before = normalizeLaoLetterSearch({ q: 'ກ', page: 1 })
    const pageOnlyChange = normalizeLaoLetterSearch({ q: 'ກ', page: 2 })
    const targetChange = normalizeLaoLetterSearch({ q: 'ຂ', page: 1 })
    const selected: SelectionState = { mode: 'query_all', expectedCount: 126, selectionHash: 'a'.repeat(64) }

    expect(invalidateSelectionForQueryChange(selected, before, pageOnlyChange)).toEqual(selected)
    expect(invalidateSelectionForQueryChange(selected, before, targetChange)).toEqual({ mode: 'none' })
  })
})
