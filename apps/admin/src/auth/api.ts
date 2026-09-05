import { apiClient } from '@/api/client'
import type { CurrentOperator } from './types'

interface LoginResponse {
  user_id: string
  access_token: string
  refresh_token: string
  password_change_required: boolean
}

interface CurrentOperatorResponse {
  operator: {
    operator_id: string
    display_name: string
    status: 'active' | 'disabled'
    roles: Array<{ role_id: string; code: string; name: string }>
    permissions: string[]
  }
}

export async function loginAdmin(username: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/api/v1/admin/auth/login', {
    skipAuth: true,
    json: { username, password },
  })
  return response.data
}

export async function getCurrentOperator() {
  const current = await apiClient.get<CurrentOperatorResponse>('/api/v1/admin/operations/me')
  const operator = current.data.operator
  if (operator.status !== 'active') throw new Error('管理员账号已被禁用。')
  const currentOperator: CurrentOperator = {
    id: operator.operator_id as CurrentOperator['id'],
    name: operator.display_name,
    roleId: operator.roles[0]?.code ?? 'super_admin',
  }
  return {
    operator: currentOperator,
    permissions: operator.permissions,
  }
}

export async function logoutAdmin(refreshToken: string): Promise<void> {
  await apiClient.post('/api/v1/identity/sessions/logout', {
    skipAuth: true,
    json: { refresh_token: refreshToken },
  })
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/api/v1/admin/auth/change-password', {
    json: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  })
}
