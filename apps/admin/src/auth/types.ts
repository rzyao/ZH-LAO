import type { Uuid } from '@/api/contracts'

/**
 * Client-side contract for an authenticated back-office operator.
 */

export interface CurrentOperator {
  id: Uuid
  name: string
  email?: string
  /** Operations RBAC role logical id. */
  roleId?: string
}

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated'
