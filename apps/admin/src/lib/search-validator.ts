/**
 * Tiny zod-based search-params validator for TanStack Router `validateSearch`.
 *
 * Falls back to the schema's defaults when the URL search input is invalid,
 * so garbage URL state degrades gracefully.
 */
export function zodSearch<T>(schema: {
  safeParse(input: unknown): { success: true; data: T } | { success: false }
}) {
  return (search: unknown): T => {
    const result = schema.safeParse(search)
    if (result.success) return result.data
    const fallback = schema.safeParse({})
    return fallback.success ? fallback.data : ({} as T)
  }
}
