import type { ComponentType } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LaoLetterSearch, LaoLetterSearchInput } from './contracts'
import { laoLetterListFixture } from './lo-letter-test-fixtures'

const pageModulePath = './lo-letter-page'
type LaoLetterPageModule = Readonly<{
  LaoLetterPageView: ComponentType<{
    state: { kind: string; data?: typeof laoLetterListFixture; querySummary?: string; error?: Error }
    onRetry?: () => void
    onRowEdit?: (row: (typeof laoLetterListFixture.items)[number]) => void
    onRowArchive?: (row: (typeof laoLetterListFixture.items)[number]) => void
  }>
  nearestValidLaoLetterPage: (input: {
    page: number; pageSize: number; total: number; itemCount: number
  }) => number
  updateLaoLetterSearch: (
    current: LaoLetterSearchInput,
    patch: Partial<LaoLetterSearchInput>,
  ) => LaoLetterSearch
}>

const loadPageModule = () => import(/* @vite-ignore */ pageModulePath) as Promise<LaoLetterPageModule>

const preferenceModulePath = './lo-letter-column-preferences'
type LaoLetterPreferenceModule = Readonly<{
  LAO_LETTER_COLUMN_PREFERENCE_KEY: string
  readLaoLetterColumnVisibility: (storage: Storage, validColumnIds: readonly string[]) => Record<string, boolean>
  clearLaoLetterColumnVisibility: (storage: Storage) => void
}>
const loadPreferenceModule = () => import(/* @vite-ignore */ preferenceModulePath) as Promise<LaoLetterPreferenceModule>

const columnsModulePath = './lo-letter-columns'
type LaoLetterColumnsModule = Readonly<{
  laoLetterColumns: ReadonlyArray<{ id?: string; enableHiding?: boolean }>
}>
const loadColumnsModule = () => import(/* @vite-ignore */ columnsModulePath) as Promise<LaoLetterColumnsModule>

describe('Lao-letter page URL and page correction rules', () => {
  const current = {
    q: 'ກ',
    letter_type: ['consonant'] as const,
    letter_class: [] as readonly string[],
    content_status: ['active'] as const,
    revision_status: [] as const,
    sort: 'sort_order' as const,
    order: 'asc' as const,
    page: 4,
    page_size: 50,
  }

  it('resets page for target-changing search/filter/sort/page-size edits but not page edits', async () => {
    const { updateLaoLetterSearch } = await loadPageModule()
    expect(updateLaoLetterSearch(current, { q: 'ຂ' }).page).toBe(1)
    expect(updateLaoLetterSearch(current, { letter_type: ['vowel'] }).page).toBe(1)
    expect(updateLaoLetterSearch(current, { sort: 'name', order: 'desc' }).page).toBe(1)
    expect(updateLaoLetterSearch(current, { page_size: 100 }).page).toBe(1)
    expect(updateLaoLetterSearch(current, { page: 5 }).page).toBe(5)
  })

  it('moves an empty out-of-range page to the nearest valid page', async () => {
    const { nearestValidLaoLetterPage } = await loadPageModule()
    expect(nearestValidLaoLetterPage({ page: 4, pageSize: 50, total: 126, itemCount: 0 })).toBe(3)
    expect(nearestValidLaoLetterPage({ page: 3, pageSize: 50, total: 126, itemCount: 26 })).toBe(3)
    expect(nearestValidLaoLetterPage({ page: 2, pageSize: 50, total: 0, itemCount: 0 })).toBe(1)
  })
})

describe('Lao-letter page states', () => {
  it('distinguishes initial loading from a non-blocking background refresh', async () => {
    const { LaoLetterPageView } = await loadPageModule()
    const initial = render(<LaoLetterPageView state={{ kind: 'initial-loading' }} />)
    expect(screen.getByTestId('lo-letter-initial-loading')).toBeInTheDocument()
    initial.unmount()

    render(<LaoLetterPageView state={{ kind: 'background-refresh', data: laoLetterListFixture }} />)
    expect(screen.getByTestId('lo-letter-background-refresh')).toBeInTheDocument()
    expect(screen.getByText('ກ')).toBeInTheDocument()
  })

  it('distinguishes a first empty list from a filtered no-result state', async () => {
    const { LaoLetterPageView } = await loadPageModule()
    const firstEmpty = render(<LaoLetterPageView state={{ kind: 'first-empty' }} />)
    expect(screen.getByTestId('lo-letter-first-empty')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '清除筛选' })).not.toBeInTheDocument()
    firstEmpty.unmount()

    render(<LaoLetterPageView state={{ kind: 'no-results', querySummary: '辅音 · active' }} />)
    expect(screen.getByTestId('lo-letter-no-results')).toHaveTextContent('辅音 · active')
    expect(screen.getByRole('button', { name: '清除筛选' })).toBeEnabled()
  })

  it('shows a recoverable error without discarding the current URL query', async () => {
    const { LaoLetterPageView } = await loadPageModule()
    const onRetry = vi.fn()
    render(
      <LaoLetterPageView
        state={{ kind: 'error', error: new Error('network unavailable') }}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByTestId('lo-letter-error')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('Lao-letter column preferences and fixed columns', () => {
  it('ignores invalid column ids and removes an expired preference version', async () => {
    const { LAO_LETTER_COLUMN_PREFERENCE_KEY, readLaoLetterColumnVisibility } = await loadPreferenceModule()
    localStorage.setItem(LAO_LETTER_COLUMN_PREFERENCE_KEY, JSON.stringify({
      version: 1,
      visibility: { name: false, obsolete_column: false },
    }))
    expect(readLaoLetterColumnVisibility(localStorage, ['name', 'romanization'])).toEqual({ name: false })

    localStorage.setItem(LAO_LETTER_COLUMN_PREFERENCE_KEY, JSON.stringify({
      version: 0,
      visibility: { name: false },
    }))
    expect(readLaoLetterColumnVisibility(localStorage, ['name', 'romanization'])).toEqual({})
    expect(localStorage.getItem(LAO_LETTER_COLUMN_PREFERENCE_KEY)).toBeNull()
  })

  it('clears the versioned preference when restoring default columns', async () => {
    const { LAO_LETTER_COLUMN_PREFERENCE_KEY, clearLaoLetterColumnVisibility } = await loadPreferenceModule()
    localStorage.setItem(LAO_LETTER_COLUMN_PREFERENCE_KEY, JSON.stringify({ version: 1, visibility: { name: false } }))
    clearLaoLetterColumnVisibility(localStorage)
    expect(localStorage.getItem(LAO_LETTER_COLUMN_PREFERENCE_KEY)).toBeNull()
  })

  it('marks selection and operation columns as non-hideable', async () => {
    const { laoLetterColumns } = await loadColumnsModule()
    expect(laoLetterColumns.find((column) => column.id === 'select')?.enableHiding).toBe(false)
    expect(laoLetterColumns.find((column) => column.id === 'actions')?.enableHiding).toBe(false)
  })

  it('keeps the operation column sticky and deletes directly without selecting the row', async () => {
    const { LaoLetterPageView } = await loadPageModule()
    const onRowArchive = vi.fn()
    render(<LaoLetterPageView state={{ kind: 'ready', data: laoLetterListFixture }} onRowArchive={onRowArchive} />)
    expect(screen.getByTestId('data-table-scroll-container')).toHaveClass('overflow-x-auto')
    const action = screen.getAllByRole('button', { name: '删除 ກ' })[0]
    action.focus()
    expect(action).toHaveFocus()
    expect(action.closest('td')).toHaveClass('sticky', 'right-0')
    fireEvent.click(action)
    expect(onRowArchive).toHaveBeenCalledWith(laoLetterListFixture.items[0])
  })

  it('offers separate edit and delete affordances', async () => {
    const { LaoLetterPageView } = await loadPageModule()
    const onRowEdit = vi.fn()
    render(<LaoLetterPageView state={{ kind: 'ready', data: laoLetterListFixture }} onRowEdit={onRowEdit} />)
    fireEvent.click(screen.getAllByRole('button', { name: '编辑 ກ' })[0])
    expect(onRowEdit).toHaveBeenCalledWith(laoLetterListFixture.items[0])
    expect(screen.getAllByRole('button', { name: '删除 ກ' })[0]).toBeEnabled()
  })
})
