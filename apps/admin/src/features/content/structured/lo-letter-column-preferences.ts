import type { VisibilityState } from '@tanstack/react-table'

export const LAO_LETTER_COLUMN_PREFERENCE_KEY = 'zh-lao.admin.content.lo-letters.columns.v1'
const PREFERENCE_VERSION = 1

export function readLaoLetterColumnVisibility(
  storage: Storage,
  validColumnIds: readonly string[],
): VisibilityState {
  const stored = storage.getItem(LAO_LETTER_COLUMN_PREFERENCE_KEY)
  if (!stored) return {}
  try {
    const value = JSON.parse(stored) as { version?: unknown; visibility?: unknown }
    if (value.version !== PREFERENCE_VERSION || !isRecord(value.visibility)) {
      storage.removeItem(LAO_LETTER_COLUMN_PREFERENCE_KEY)
      return {}
    }
    const validIds = new Set(validColumnIds)
    const visibility: VisibilityState = {}
    for (const [id, visible] of Object.entries(value.visibility)) {
      if (validIds.has(id) && typeof visible === 'boolean') visibility[id] = visible
    }
    return visibility
  } catch {
    storage.removeItem(LAO_LETTER_COLUMN_PREFERENCE_KEY)
    return {}
  }
}

export function writeLaoLetterColumnVisibility(storage: Storage, visibility: VisibilityState): void {
  storage.setItem(LAO_LETTER_COLUMN_PREFERENCE_KEY, JSON.stringify({
    version: PREFERENCE_VERSION,
    visibility,
  }))
}

export function clearLaoLetterColumnVisibility(storage: Storage): void {
  storage.removeItem(LAO_LETTER_COLUMN_PREFERENCE_KEY)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
