/**
 * Module-level access-token store.
 *
 * Kept outside React so the API client singleton can read the current token
 * without depending on component context. The AuthProvider writes here when
 * auth state changes. Real Operator login/session lives in a later
 * Identity/Operations phase — this is the skeleton contract only.
 */

let accessToken: string | null = null

const listeners = new Set<(token: string | null) => void>()

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
  for (const listener of listeners) listener(token)
}

export function subscribeAccessToken(
  listener: (token: string | null) => void,
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
