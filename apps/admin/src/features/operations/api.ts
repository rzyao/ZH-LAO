import { apiClient } from '@/api/client'
import {
  assignedRoleSchema,
  auditLogListResponseSchema,
  auditLogSchema,
  operatorDetailSchema,
  operatorListResponseSchema,
  operatorSummarySchema,
  permissionCatalogResponseSchema,
  roleDetailSchema,
  roleListResponseSchema,
  rolePermissionsResponseSchema,
  roleSummarySchema,
  type AuditLogQueryInput,
  type OperatorCreateInput,
  type OperatorUpdateInput,
  type RoleCreateInput,
  type RoleUpdateInput,
} from './contracts'
import { z } from 'zod'

const base = '/api/v1/admin/operations'

export const operationsAdminApi = {
  /* ---------- Current Operator ---------- */
  async getCurrentOperator(signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/me`, { signal })
    return response.data as {
      operator: {
        operator_id: string
        display_name: string
        status: 'active' | 'disabled'
        roles: Array<{ role_id: string; code: string; name: string }>
        permissions: string[]
      }
    }
  },

  /* ---------- Operators ---------- */
  async listOperators(params?: { page?: number; page_size?: number; status?: 'active' | 'disabled' }, signal?: AbortSignal) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))
    if (params?.status) query.set('status', params.status)

    const url = `${base}/operators${query.toString() ? `?${query.toString()}` : ''}`
    const response = await apiClient.get(url, { signal })
    return operatorListResponseSchema.parse(response.data)
  },

  async getOperator(operatorId: string, signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/operators/${encodeURIComponent(operatorId)}`, { signal })
    const parsed = z.object({ operator: operatorDetailSchema }).parse(response.data)
    return parsed.operator
  },

  async createOperator(input: OperatorCreateInput) {
    const response = await apiClient.post(`${base}/operators`, {
      json: input,
    })
    const parsed = z.object({ operator: operatorSummarySchema }).parse(response.data)
    return parsed.operator
  },

  async updateOperator(operatorId: string, input: OperatorUpdateInput) {
    const response = await apiClient.patch(`${base}/operators/${encodeURIComponent(operatorId)}`, {
      json: input,
    })
    const parsed = z.object({ operator: operatorSummarySchema }).parse(response.data)
    return parsed.operator
  },

  async enableOperator(operatorId: string) {
    const response = await apiClient.post(`${base}/operators/${encodeURIComponent(operatorId)}/enable`)
    const parsed = z.object({ operator: operatorSummarySchema }).parse(response.data)
    return parsed.operator
  },

  async disableOperator(operatorId: string) {
    const response = await apiClient.post(`${base}/operators/${encodeURIComponent(operatorId)}/disable`)
    const parsed = z.object({ operator: operatorSummarySchema }).parse(response.data)
    return parsed.operator
  },

  async listOperatorRoles(operatorId: string, signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/operators/${encodeURIComponent(operatorId)}/roles`, { signal })
    const parsed = z.object({ roles: z.array(assignedRoleSchema) }).parse(response.data)
    return parsed.roles
  },

  async assignOperatorRole(operatorId: string, roleId: string) {
    const response = await apiClient.put(`${base}/operators/${encodeURIComponent(operatorId)}/roles/${encodeURIComponent(roleId)}`)
    return response.data as { assigned: boolean; changed: boolean }
  },

  async revokeOperatorRole(operatorId: string, roleId: string) {
    const response = await apiClient.delete(`${base}/operators/${encodeURIComponent(operatorId)}/roles/${encodeURIComponent(roleId)}`)
    return response.data
  },

  /* ---------- Roles ---------- */
  async listRoles(params?: { page?: number; page_size?: number; status?: 'active' | 'disabled' }, signal?: AbortSignal) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))
    if (params?.status) query.set('status', params.status)

    const url = `${base}/roles${query.toString() ? `?${query.toString()}` : ''}`
    const response = await apiClient.get(url, { signal })
    return roleListResponseSchema.parse(response.data)
  },

  async getRole(roleId: string, signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/roles/${encodeURIComponent(roleId)}`, { signal })
    const parsed = z.object({ role: roleDetailSchema }).parse(response.data)
    return parsed.role
  },

  async createRole(input: RoleCreateInput) {
    const response = await apiClient.post(`${base}/roles`, {
      json: {
        code: input.code,
        name: input.name,
        description: input.description ?? null,
      },
    })
    const parsed = z.object({ role: roleSummarySchema }).parse(response.data)
    return parsed.role
  },

  async updateRole(roleId: string, input: RoleUpdateInput) {
    const response = await apiClient.patch(`${base}/roles/${encodeURIComponent(roleId)}`, {
      json: {
        name: input.name,
        description: input.description ?? null,
      },
    })
    const parsed = z.object({ role: roleSummarySchema }).parse(response.data)
    return parsed.role
  },

  async enableRole(roleId: string) {
    const response = await apiClient.post(`${base}/roles/${encodeURIComponent(roleId)}/enable`)
    const parsed = z.object({ role: roleSummarySchema }).parse(response.data)
    return parsed.role
  },

  async disableRole(roleId: string) {
    const response = await apiClient.post(`${base}/roles/${encodeURIComponent(roleId)}/disable`)
    const parsed = z.object({ role: roleSummarySchema }).parse(response.data)
    return parsed.role
  },

  /* ---------- Permissions ---------- */
  async listPermissionCatalog(signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/permissions`, { signal })
    return permissionCatalogResponseSchema.parse(response.data).permissions
  },

  async getRolePermissions(roleId: string, signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/roles/${encodeURIComponent(roleId)}/permissions`, { signal })
    return rolePermissionsResponseSchema.parse(response.data).permissions
  },

  async setRolePermissions(roleId: string, permissionKeys: string[]) {
    const response = await apiClient.put(`${base}/roles/${encodeURIComponent(roleId)}/permissions`, {
      json: { permission_keys: permissionKeys },
    })
    return response.data as { role_id: string; permissions: string[]; changed: boolean }
  },

  /* ---------- Audit Logs ---------- */
  async listAuditLogs(params?: AuditLogQueryInput, signal?: AbortSignal) {
    const query = new URLSearchParams()
    if (params?.operator_id) query.set('operator_id', params.operator_id)
    if (params?.action_key) query.set('action_key', params.action_key)
    if (params?.target_domain) query.set('target_domain', params.target_domain)
    if (params?.target_type) query.set('target_type', params.target_type)
    if (params?.target_id) query.set('target_id', params.target_id)
    if (params?.request_id) query.set('request_id', params.request_id)
    if (params?.created_from) query.set('created_from', params.created_from)
    if (params?.created_to) query.set('created_to', params.created_to)
    if (params?.cursor) query.set('cursor', params.cursor)
    if (params?.limit) query.set('limit', String(params.limit))

    const url = `${base}/audit-logs${query.toString() ? `?${query.toString()}` : ''}`
    const response = await apiClient.get(url, { signal })
    return auditLogListResponseSchema.parse(response.data)
  },

  async getAuditLog(auditLogId: string, signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/audit-logs/${encodeURIComponent(auditLogId)}`, { signal })
    const parsed = z.object({ audit_log: auditLogSchema }).parse(response.data)
    return parsed.audit_log
  },
}
