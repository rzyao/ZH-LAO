import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { operationsAdminApi } from './api'
import type {
  AuditLogQueryInput,
  OperatorCreateInput,
  OperatorUpdateInput,
  RoleCreateInput,
  RoleUpdateInput,
} from './contracts'

export const operationsQueryKeys = {
  root: ['operations-admin'] as const,
  operators: (params?: { page?: number; page_size?: number; status?: 'active' | 'disabled' }) =>
    [...operationsQueryKeys.root, 'operators', params ?? {}] as const,
  operatorDetail: (id: string) => [...operationsQueryKeys.root, 'operator', id] as const,
  operatorRoles: (id: string) => [...operationsQueryKeys.root, 'operator-roles', id] as const,
  roles: (params?: { page?: number; page_size?: number; status?: 'active' | 'disabled' }) =>
    [...operationsQueryKeys.root, 'roles', params ?? {}] as const,
  roleDetail: (id: string) => [...operationsQueryKeys.root, 'role', id] as const,
  rolePermissions: (id: string) => [...operationsQueryKeys.root, 'role-permissions', id] as const,
  permissionCatalog: () => [...operationsQueryKeys.root, 'permission-catalog'] as const,
  auditLogs: (params?: AuditLogQueryInput) =>
    [...operationsQueryKeys.root, 'audit-logs', params ?? {}] as const,
  auditLogDetail: (id: string) => [...operationsQueryKeys.root, 'audit-log', id] as const,
}

/* ---------- Operators Queries & Mutations ---------- */

export function useOperatorsQuery(params?: { page?: number; page_size?: number; status?: 'active' | 'disabled' }) {
  return useQuery({
    queryKey: operationsQueryKeys.operators(params),
    queryFn: ({ signal }) => operationsAdminApi.listOperators(params, signal),
  })
}

export function useOperatorDetailQuery(operatorId: string) {
  return useQuery({
    queryKey: operationsQueryKeys.operatorDetail(operatorId),
    queryFn: ({ signal }) => operationsAdminApi.getOperator(operatorId, signal),
    enabled: Boolean(operatorId),
  })
}

export function useOperatorRolesQuery(operatorId: string) {
  return useQuery({
    queryKey: operationsQueryKeys.operatorRoles(operatorId),
    queryFn: ({ signal }) => operationsAdminApi.listOperatorRoles(operatorId, signal),
    enabled: Boolean(operatorId),
  })
}

export function useCreateOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OperatorCreateInput) => operationsAdminApi.createOperator(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'operators'] })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useUpdateOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ operatorId, input }: { operatorId: string; input: OperatorUpdateInput }) =>
      operationsAdminApi.updateOperator(operatorId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'operators'] })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operatorDetail(variables.operatorId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useEnableOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (operatorId: string) => operationsAdminApi.enableOperator(operatorId),
    onSuccess: (_data, operatorId) => {
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'operators'] })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operatorDetail(operatorId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useDisableOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (operatorId: string) => operationsAdminApi.disableOperator(operatorId),
    onSuccess: (_data, operatorId) => {
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'operators'] })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operatorDetail(operatorId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useResetOperatorPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (operatorId: string) => operationsAdminApi.resetOperatorPassword(operatorId),
    retry: false,
    onSuccess: (_data, operatorId) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operatorDetail(operatorId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useAssignOperatorRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ operatorId, roleId }: { operatorId: string; roleId: string }) =>
      operationsAdminApi.assignOperatorRole(operatorId, roleId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operatorRoles(variables.operatorId) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operatorDetail(variables.operatorId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'operators'] })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useRevokeOperatorRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ operatorId, roleId }: { operatorId: string; roleId: string }) =>
      operationsAdminApi.revokeOperatorRole(operatorId, roleId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operatorRoles(variables.operatorId) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operatorDetail(variables.operatorId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'operators'] })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

/* ---------- Roles Queries & Mutations ---------- */

export function useRolesQuery(params?: { page?: number; page_size?: number; status?: 'active' | 'disabled' }) {
  return useQuery({
    queryKey: operationsQueryKeys.roles(params),
    queryFn: ({ signal }) => operationsAdminApi.listRoles(params, signal),
  })
}

export function useRoleDetailQuery(roleId: string) {
  return useQuery({
    queryKey: operationsQueryKeys.roleDetail(roleId),
    queryFn: ({ signal }) => operationsAdminApi.getRole(roleId, signal),
    enabled: Boolean(roleId),
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RoleCreateInput) => operationsAdminApi.createRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'roles'] })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, input }: { roleId: string; input: RoleUpdateInput }) =>
      operationsAdminApi.updateRole(roleId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'roles'] })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.roleDetail(variables.roleId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useEnableRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => operationsAdminApi.enableRole(roleId),
    onSuccess: (_data, roleId) => {
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'roles'] })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.roleDetail(roleId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

export function useDisableRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => operationsAdminApi.disableRole(roleId),
    onSuccess: (_data, roleId) => {
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'roles'] })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.roleDetail(roleId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

/* ---------- Permissions Queries & Mutations ---------- */

export function usePermissionCatalogQuery() {
  return useQuery({
    queryKey: operationsQueryKeys.permissionCatalog(),
    queryFn: ({ signal }) => operationsAdminApi.listPermissionCatalog(signal),
  })
}

export function useRolePermissionsQuery(roleId: string) {
  return useQuery({
    queryKey: operationsQueryKeys.rolePermissions(roleId),
    queryFn: ({ signal }) => operationsAdminApi.getRolePermissions(roleId, signal),
    enabled: Boolean(roleId),
  })
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionKeys }: { roleId: string; permissionKeys: string[] }) =>
      operationsAdminApi.setRolePermissions(roleId, permissionKeys),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.rolePermissions(variables.roleId) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.roleDetail(variables.roleId) })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'roles'] })
      queryClient.invalidateQueries({ queryKey: [...operationsQueryKeys.root, 'audit-logs'] })
    },
  })
}

/* ---------- Audit Logs Queries ---------- */

export function useAuditLogsQuery(params?: AuditLogQueryInput) {
  return useQuery({
    queryKey: operationsQueryKeys.auditLogs(params),
    queryFn: ({ signal }) => operationsAdminApi.listAuditLogs(params, signal),
  })
}

export function useAuditLogDetailQuery(auditLogId: string) {
  return useQuery({
    queryKey: operationsQueryKeys.auditLogDetail(auditLogId),
    queryFn: ({ signal }) => operationsAdminApi.getAuditLog(auditLogId, signal),
    enabled: Boolean(auditLogId),
  })
}
