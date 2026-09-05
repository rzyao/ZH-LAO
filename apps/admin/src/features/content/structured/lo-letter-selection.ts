import { laoLetterSelectionQuery, type LaoLetterSearchInput } from './contracts'

export type LaoLetterSelectionState =
  | Readonly<{ mode: 'none' }>
  | Readonly<{ mode: 'page_ids'; contentIds: readonly string[] }>
  | Readonly<{ mode: 'query_all'; expectedCount: number; selectionHash: string }>

export const NO_LAO_LETTER_SELECTION: LaoLetterSelectionState = Object.freeze({ mode: 'none' })

export function createPageSelection(contentIds: readonly string[]): LaoLetterSelectionState {
  return contentIds.length === 0
    ? NO_LAO_LETTER_SELECTION
    : { mode: 'page_ids', contentIds: [...contentIds] }
}

export function upgradeToQueryAll(
  state: LaoLetterSelectionState,
  preview: Readonly<{ expectedCount: number; selectionHash: string }>,
  allPageSelected: boolean,
): LaoLetterSelectionState {
  if (state.mode !== 'page_ids' || !allPageSelected) return state
  return {
    mode: 'query_all',
    expectedCount: preview.expectedCount,
    selectionHash: preview.selectionHash,
  }
}

export function isCurrentPageFullySelected(
  state: LaoLetterSelectionState,
  currentPageIds: readonly string[],
  rowSelection: Readonly<Record<string, boolean>>,
): boolean {
  return state.mode === 'page_ids'
    && currentPageIds.length > 0
    && currentPageIds.every((contentId) => rowSelection[contentId] === true)
}

export function invalidateSelectionForQueryChange(
  state: LaoLetterSelectionState,
  previousQuery: LaoLetterSearchInput,
  nextQuery: LaoLetterSearchInput,
): LaoLetterSelectionState {
  return selectionQueryKey(previousQuery) === selectionQueryKey(nextQuery)
    ? state
    : NO_LAO_LETTER_SELECTION
}

export function selectionQueryKey(query: LaoLetterSearchInput): string {
  return JSON.stringify(laoLetterSelectionQuery(query))
}
