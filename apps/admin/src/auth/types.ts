import type { Uuid } from '@/api/contracts'

/**
 * Auth skeleton types (ADM-F13).
 *
 * Real Operator login / session / permission fetch arrive with the
 * Identity / Operations phases. This file only freezes the client-side
 * contract.
 */

/** Placeholder for the authenticated back-office operator. */
export interface CurrentOperator {
  id: Uuid
  name: string
  email?: string
  /** Operations RBAC role logical id (empty until Operations phase). */
  roleId?: string
}

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated'
