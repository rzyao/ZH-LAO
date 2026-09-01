import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Check, Shield, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table/data-table'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusBadge } from '@/components/common/status-badge'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useToastApi } from '@/components/feedback/use-toast'
import { useAuth } from '@/auth/context/AuthContext'
import {
  OPERATIONS_PERMISSIONS,
  operatorCreateInputSchema,
  operatorUpdateInputSchema,
  type OperatorCreateInput,
  type OperatorSummary,
  type OperatorUpdateInput,
} from '../contracts'
import {
  useAssignOperatorRole,
  useCreateOperator,
  useDisableOperator,
  useEnableOperator,
  useOperatorRolesQuery,
  useOperatorsQuery,
  useRevokeOperatorRole,
  useRolesQuery,
  useUpdateOperator,
} from '../queries'
import {
  FormField,
  PermissionContract,
  formatDateTime,
  mutationErrorMessage,
  useExactPermission,
} from '../components'

export function OperatorsPage() {
  const { operator: currentOperator } = useAuth()
  const toast = useToastApi()
  const query = useOperatorsQuery({ page: 1, page_size: 100 })
  const rolesQuery = useRolesQuery({ page: 1, page_size: 100 })

  const canCreate = useExactPermission(OPERATIONS_PERMISSIONS.operatorsCreate)
  const canUpdate = useExactPermission(OPERATIONS_PERMISSIONS.operatorsUpdate)
  const canDisable = useExactPermission(OPERATIONS_PERMISSIONS.operatorsDisable)
  const canEnable = useExactPermission(OPERATIONS_PERMISSIONS.operatorsEnable)
  const canAssignRole = useExactPermission(OPERATIONS_PERMISSIONS.operatorRolesAssign)
  const canRevokeRole = useExactPermission(OPERATIONS_PERMISSIONS.operatorRolesRevoke)

  const disableMutation = useDisableOperator()
  const enableMutation = useEnableOperator()

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<OperatorSummary | null>(null)
  const [togglingStatus, setTogglingStatus] = React.useState<OperatorSummary | null>(null)
  const [managingRolesOperator, setManagingRolesOperator] = React.useState<OperatorSummary | null>(null)

  const fail = (error: unknown) =>
    toast.error({ title: '操作员操作失败', description: mutationErrorMessage(error) })

  const columns = React.useMemo<ColumnDef<OperatorSummary>[]>(
    () => [
      {
        accessorKey: 'display_name',
        header: '显示名称',
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.original.display_name}</span>
            {currentOperator?.id === row.original.operator_id ? (
              <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary font-normal">
                当前登录
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'auth_subject_id',
        header: '关联 Identity UUID',
        cell: ({ row }) => (
          <code className="text-xs text-muted-foreground">{row.original.auth_subject_id}</code>
        ),
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <StatusBadge
            tone={row.original.status === 'active' ? 'success' : 'danger'}
            label={row.original.status === 'active' ? '正常激活' : '已禁用'}
          />
        ),
      },
      {
        accessorKey: 'created_at',
        header: '创建时间',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{formatDateTime(row.original.created_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: '操作',
        enableSorting: false,
        cell: ({ row }) => {
          const operator = row.original
          const isSelf = currentOperator?.id === operator.operator_id
          const isActive = operator.status === 'active'

          return (
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={!canUpdate}
                onClick={() => setEditing(operator)}
              >
                编辑
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canAssignRole && !canRevokeRole}
                onClick={() => setManagingRolesOperator(operator)}
              >
                <Shield className="mr-1 size-3.5" />
                角色配置
              </Button>
              {isActive ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!canDisable || isSelf}
                  title={isSelf ? '无法禁用当前登录的自身账号' : undefined}
                  onClick={() => setTogglingStatus(operator)}
                >
                  禁用
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canEnable}
                  onClick={() => setTogglingStatus(operator)}
                >
                  启用
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [canUpdate, canAssignRole, canRevokeRole, canDisable, canEnable, currentOperator?.id],
  )

  return (
    <ListPageLayout
      title="操作员管理"
      description="管理系统后台操作员映射、查看操作员激活状态并分配系统管理角色。操作员无物理/软删除。"
      breadcrumb={[{ label: '系统运维' }, { label: '运营权限', href: '/operations' }, { label: '操作员管理' }]}
      actions={
        <Button disabled={!canCreate} onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-1 size-4" />
          新建操作员
        </Button>
      }
    >
      <div className="p-4">
        <PermissionContract
          read={OPERATIONS_PERMISSIONS.operatorsRead}
          write={OPERATIONS_PERMISSIONS.operatorsCreate}
        />
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => query.refetch()}
          getRowId={(row) => row.operator_id}
          emptyTitle="暂无操作员"
          emptyDescription="具备创建权限时可添加首个后台操作员。"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          安全不变量：系统严禁禁用最后一位激活的超级管理员（super_admin），且登录操作员不可禁用自身账号。
        </p>
      </div>

      {/* Create Dialog */}
      <CreateOperatorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false)
          toast.success({ title: '操作员创建成功', description: '新操作员已创建，请为其分配管理角色。' })
        }}
        onError={fail}
      />

      {/* Edit Dialog */}
      {editing ? (
        <EditOperatorDialog
          operator={editing}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          onSuccess={() => {
            setEditing(null)
            toast.success({ title: '更新成功', description: '操作员信息已保存。' })
          }}
          onError={fail}
        />
      ) : null}

      {/* Toggle Status Confirm */}
      {togglingStatus ? (
        <ConfirmDialog
          open={Boolean(togglingStatus)}
          onOpenChange={(open) => !open && setTogglingStatus(null)}
          title={togglingStatus.status === 'active' ? '确认禁用操作员？' : '确认启用操作员？'}
          description={
            togglingStatus.status === 'active'
              ? `禁用后，操作员 "${togglingStatus.display_name}" 将立即失去所有后台 API 访问与操作权限。`
              : `启用后，操作员 "${togglingStatus.display_name}" 将恢复其已分配角色的全部权限。`
          }
          destructive={togglingStatus.status === 'active'}
          confirmLabel={togglingStatus.status === 'active' ? '确认禁用' : '确认启用'}
          loading={disableMutation.isPending || enableMutation.isPending}
          onConfirm={async () => {
            try {
              if (togglingStatus.status === 'active') {
                await disableMutation.mutateAsync(togglingStatus.operator_id)
                toast.success({ title: '已禁用操作员', description: `操作员 ${togglingStatus.display_name} 已停用。` })
              } else {
                await enableMutation.mutateAsync(togglingStatus.operator_id)
                toast.success({ title: '已启用操作员', description: `操作员 ${togglingStatus.display_name} 已恢复激活。` })
              }
              setTogglingStatus(null)
            } catch (err) {
              fail(err)
            }
          }}
        />
      ) : null}

      {/* Manage Roles Drawer/Modal */}
      {managingRolesOperator ? (
        <ManageOperatorRolesDialog
          operator={managingRolesOperator}
          open={Boolean(managingRolesOperator)}
          onOpenChange={(open) => !open && setManagingRolesOperator(null)}
          allRoles={rolesQuery.data?.items ?? []}
          canAssign={canAssignRole}
          canRevoke={canRevokeRole}
        />
      ) : null}
    </ListPageLayout>
  )
}

/* ---------- Subcomponents ---------- */

function CreateOperatorDialog({
  open,
  onOpenChange,
  onSuccess,
  onError,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onError: (error: unknown) => void
}) {
  const mutation = useCreateOperator()
  const form = useForm<OperatorCreateInput>({
    resolver: zodResolver(operatorCreateInputSchema),
    defaultValues: {
      auth_subject_id: '',
      display_name: '',
    },
  })

  React.useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  const onSubmit = async (values: OperatorCreateInput) => {
    try {
      await mutation.mutateAsync(values)
      onSuccess()
    } catch (err) {
      onError(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建后台操作员</DialogTitle>
          <DialogDescription>
            将已有 Identity 用户 UUID 映射为系统操作员。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="用户 Identity UUID (auth_subject_id)"
            htmlFor="auth_subject_id"
            error={form.formState.errors.auth_subject_id?.message}
            hint="必须为真实有效的 Identity 模块用户 UUID。"
          >
            <Input
              id="auth_subject_id"
              placeholder="例如 00000000-0000-0000-0000-000000000000"
              {...form.register('auth_subject_id')}
            />
          </FormField>
          <FormField
            label="显示名称"
            htmlFor="display_name"
            error={form.formState.errors.display_name?.message}
            hint="后台管理控制台中展示的姓名或昵称。"
          >
            <Input id="display_name" placeholder="例如 张三 (运营)" {...form.register('display_name')} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '创建中...' : '确认创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditOperatorDialog({
  operator,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: {
  operator: OperatorSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onError: (error: unknown) => void
}) {
  const mutation = useUpdateOperator()
  const form = useForm<OperatorUpdateInput>({
    resolver: zodResolver(operatorUpdateInputSchema),
    defaultValues: {
      display_name: operator.display_name,
    },
  })

  const onSubmit = async (values: OperatorUpdateInput) => {
    try {
      await mutation.mutateAsync({ operatorId: operator.operator_id, input: values })
      onSuccess()
    } catch (err) {
      onError(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑操作员</DialogTitle>
          <DialogDescription>修改操作员显示名称。</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="显示名称"
            htmlFor="edit_display_name"
            error={form.formState.errors.display_name?.message}
          >
            <Input id="edit_display_name" {...form.register('display_name')} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '保存中...' : '保存更改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ManageOperatorRolesDialog({
  operator,
  open,
  onOpenChange,
  allRoles,
  canAssign,
  canRevoke,
}: {
  operator: OperatorSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  allRoles: Array<{ role_id: string; code: string; name: string; status: 'active' | 'disabled' }>
  canAssign: boolean
  canRevoke: boolean
}) {
  const toast = useToastApi()
  const rolesQuery = useOperatorRolesQuery(operator.operator_id)
  const assignMutation = useAssignOperatorRole()
  const revokeMutation = useRevokeOperatorRole()

  const assignedRoleIds = new Set(rolesQuery.data?.map((r) => r.role_id) ?? [])

  const handleToggle = async (roleId: string, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await revokeMutation.mutateAsync({ operatorId: operator.operator_id, roleId })
        toast.success({ title: '角色已解绑', description: '该角色已被移除。' })
      } else {
        await assignMutation.mutateAsync({ operatorId: operator.operator_id, roleId })
        toast.success({ title: '角色分配成功', description: '该角色已赋予操作员。' })
      }
    } catch (err) {
      toast.error({ title: '角色分配失败', description: mutationErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>分配角色 — {operator.display_name}</DialogTitle>
          <DialogDescription>
            为操作员勾选或取消关联的管理角色。所有激活角色的权限将进行 UNION 合并。
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {allRoles.map((role) => {
            const isAssigned = assignedRoleIds.has(role.role_id)
            const isPending =
              (assignMutation.isPending && assignMutation.variables?.roleId === role.role_id) ||
              (revokeMutation.isPending && revokeMutation.variables?.roleId === role.role_id)

            return (
              <div
                key={role.role_id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/30"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{role.name}</span>
                    <code className="text-xs text-muted-foreground">{role.code}</code>
                  </div>
                  {role.status === 'disabled' ? (
                    <span className="text-xs text-destructive">角色已禁用 (不生效)</span>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant={isAssigned ? 'default' : 'outline'}
                  disabled={isPending || (!canAssign && !isAssigned) || (!canRevoke && isAssigned)}
                  onClick={() => handleToggle(role.role_id, isAssigned)}
                >
                  {isAssigned ? (
                    <>
                      <Check className="mr-1 size-3.5" />
                      已分配
                    </>
                  ) : (
                    '分配'
                  )}
                </Button>
              </div>
            )
          })}
          {allRoles.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">暂无可分配角色</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
