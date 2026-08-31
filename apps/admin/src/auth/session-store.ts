import type { CurrentOperator } from './types'

const STORAGE_KEY = 'zh-lao.admin.session'

export interface AdminSession {
  accessToken: string
  refreshToken: string
  operator: CurrentOperator
  permissions: string[]
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function readAdminSession(): AdminSession | null {
  const value = storage()?.getItem(STORAGE_KEY)
  if (!value) return null
  try {
    const session = JSON.parse(value) as Partial<AdminSession>
    if (!session.accessToken || !session.refreshToken || !session.operator || typeof session.operator.id !== 'string' || typeof session.operator.name !== 'string' || !Array.isArray(session.permissions)) return null
    return { ...session, permissions: session.permissions.filter((permission): permission is string => typeof permission === 'string') } as AdminSession
  } catch {
    return null
  }
}

export function writeAdminSession(session: AdminSession): void {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearAdminSession(): void {
  storage()?.removeItem(STORAGE_KEY)
}
