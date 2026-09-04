import { z } from 'zod'

export const OPERATIONS_PERMISSIONS = {
  operatorsRead: 'operations.operators.read',
  operatorsCreate: 'operations.operators.create',
  operatorsUpdate: 'operations.operators.update',
  operatorsDisable: 'operations.operators.disable',
  operatorsEnable: 'operations.operators.enable',
  rolesRead: 'operations.roles.read',
  rolesCreate: 'operations.roles.create',
  rolesUpdate: 'operations.roles.update',
  rolesDisable: 'operations.roles.disable',
  rolesEnable: 'operations.roles.enable',
  operatorRolesRead: 'operations.operator_roles.read',
  operatorRolesAssign: 'operations.operator_roles.assign',
  operatorRolesRevoke: 'operations.operator_roles.revoke',
  rolePermissionsRead: 'operations.role_permissions.read',
  rolePermissionsSet: 'operations.role_permissions.set',
  auditLogsRead: 'operations.audit_logs.read',
} as const

export type OperationsPermission =
  (typeof OPERATIONS_PERMISSIONS)[keyof typeof OPERATIONS_PERMISSIONS]

const isoDateTimeSchema = z.string().min(1)
const statusSchema = z.enum(['active', 'disabled'])

export const roleSummarySchema = z.object({
  role_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  status: statusSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
})
export type RoleSummary = z.infer<typeof roleSummarySchema>

export const roleDetailSchema = roleSummarySchema
export type RoleDetail = z.infer<typeof roleDetailSchema>

export const operatorSummarySchema = z.object({
  operator_id: z.string().uuid(),
  auth_subject_id: z.string().uuid(),
  display_name: z.string(),
  status: statusSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
})
export type OperatorSummary = z.infer<typeof operatorSummarySchema>

export const operatorDetailSchema = operatorSummarySchema.extend({
  roles: z.array(roleSummarySchema),
})
export type OperatorDetail = z.infer<typeof operatorDetailSchema>

export const assignedRoleSchema = roleSummarySchema.extend({
  assigned_at: isoDateTimeSchema.optional(),
})
export type AssignedRole = z.infer<typeof assignedRoleSchema>

export const permissionCatalogItemSchema = z.object({
  key: z.string(),
  domain: z.string(),
  resource: z.string(),
  action: z.string(),
})
export type PermissionCatalogItem = z.infer<typeof permissionCatalogItemSchema>

export const auditLogSchema = z.object({
  audit_log_id: z.string().uuid(),
  operator_id: z.string().uuid(),
  action_key: z.string(),
  target: z
    .object({
      domain: z.string(),
      type: z.string().nullable().optional(),
      id: z.string().nullable().optional(),
    })
    .nullable(),
  request_id: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()),
  created_at: isoDateTimeSchema,
  result: z.literal('success'),
})
export type AuditLog = z.infer<typeof auditLogSchema>

/* ---------- List Response Schemas ---------- */

export const operatorListResponseSchema = z.object({
  items: z.array(operatorSummarySchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
})
export type OperatorListResponse = z.infer<typeof operatorListResponseSchema>

export const roleListResponseSchema = z.object({
  items: z.array(roleSummarySchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
})
export type RoleListResponse = z.infer<typeof roleListResponseSchema>

export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogSchema),
  next_cursor: z.string().nullable().optional(),
})
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>

export const permissionCatalogResponseSchema = z.object({
  permissions: z.array(permissionCatalogItemSchema),
})

export const rolePermissionsResponseSchema = z.object({
  role_id: z.string().uuid(),
  permissions: z.array(z.string()),
})

/* ---------- Inputs ---------- */

export const operatorCreateInputSchema = z.object({
  username: z.string().trim().min(1, '请输入后台登录用户名').max(100, '用户名不超过100个字符'),
  display_name: z.string().min(1, '请输入显示名称').max(100, '显示名称不超过100个字符'),
})
export type OperatorCreateInput = z.infer<typeof operatorCreateInputSchema>

export const operatorUpdateInputSchema = z.object({
  display_name: z.string().min(1, '请输入显示名称').max(100, '显示名称不超过100个字符'),
})
export type OperatorUpdateInput = z.infer<typeof operatorUpdateInputSchema>

export const roleCreateInputSchema = z.object({
  code: z
    .string()
    .min(1, '请输入角色标识')
    .max(50, '角色标识不超过50个字符')
    .regex(/^[a-z][a-z0-9_]*$/, '角色标识须为小写字母开头、仅含小写字母、数字及下划线'),
  name: z.string().min(1, '请输入角色名称').max(100, '角色名称不超过100个字符'),
  description: z.string().max(500, '角色描述不超过500个字符').optional().nullable(),
})
export type RoleCreateInput = z.infer<typeof roleCreateInputSchema>

export const roleUpdateInputSchema = z.object({
  name: z.string().min(1, '请输入角色名称').max(100, '角色名称不超过100个字符').optional(),
  description: z.string().max(500, '角色描述不超过500个字符').optional().nullable(),
})
export type RoleUpdateInput = z.infer<typeof roleUpdateInputSchema>

export const auditLogQueryInputSchema = z.object({
  operator_id: z.string().uuid().optional(),
  action_key: z.string().optional(),
  target_domain: z.string().optional(),
  target_type: z.string().optional(),
  target_id: z.string().uuid().optional(),
  request_id: z.string().optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
})
export type AuditLogQueryInput = z.infer<typeof auditLogQueryInputSchema>
