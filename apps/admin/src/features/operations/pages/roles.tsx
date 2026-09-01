import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { KeyRound, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table/data-table'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusBadge } from '@/components/common/status-badge'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useToastApi } from '@/components/feedback/use-toast'
import {
  OPERATIONS_PERMISSIONS,
  roleCreateInputSchema,
  roleUpdateInputSchema,
  type PermissionCatalogItem,
  type RoleCreateInput,
  type RoleSummary,
  type RoleUpdateInput,
} from '../contracts'
import {
  useCreateRole,
  useDisableRole,
  useEnableRole,
  usePermissionCatalogQuery,
  useRolePermissionsQuery,
  useRolesQuery,
  useSetRolePermissions,
  useUpdateRole,
} from '../queries'
import {
  FormField,
  PermissionContract,
  formatDateTime,
  mutationErrorMessage,
  useExactPermission,
} from '../components'

export function RolesPage() {
  const toast = useToastApi()
  const query = useRolesQuery({ page: 1, page_size: 100 })
  const catalogQuery = usePermissionCatalogQuery()

  const canCreate = useExactPermission(OPERATIONS_PERMISSIONS.rolesCreate)
  const canUpdate = useExactPermission(OPERATIONS_PERMISSIONS.rolesUpdate)
  const canDisable = useExactPermission(OPERATIONS_PERMISSIONS.rolesDisable)
  const canEnable = useExactPermission(OPERATIONS_PERMISSIONS.rolesEnable)
  const canSetPermissions = useExactPermission(OPERATIONS_PERMISSIONS.rolePermissionsSet)

  const disableMutation = useDisableRole()
  const enableMutation = useEnableRole()

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<RoleSummary | null>(null)
  const [togglingStatus, setTogglingStatus] = React.useState<RoleSummary | null>(null)
  const [configuringRole, setConfiguringRole] = React.useState<RoleSummary | null>(null)

  const fail = (error: unknown) =>
    toast.error({ title: '角色操作失败', description: mutationErrorMessage(error) })

  const columns = React.useMemo<ColumnDef<RoleSummary>[]>(
    () => [
      {
        accessorKey: 'name',
        header: '角色名称',
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.original.name}</span>
            {row.original.code === 'super_admin' ? (
              <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-400 font-normal">
                保留系统角色
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'code',
        header: '角色代码 (Code)',
        cell: ({ row }) => <code className="text-xs">{row.original.code}</code>,
      },
      {
        accessorKey: 'description',
        header: '描述',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.description || '—'}</span>
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
        accessorKey: 'updated_at',
        header: '最后更新',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{formatDateTime(row.original.updated_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: '操作',
        enableSorting: false,
        cell: ({ row }) => {
          const role = row.original
          const isSuperAdmin = role.code === 'super_admin'
          const isActive = role.status === 'active'

          return (
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={!canUpdate}
                onClick={() => setEditing(role)}
              >
                编辑
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canSetPermissions}
                onClick={() => setConfiguringRole(role)}
              >
                <KeyRound className="mr-1 size-3.5" />
                权限矩阵
              </Button>
              {isActive ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!canDisable || isSuperAdmin}
                  title={isSuperAdmin ? '系统 super_admin 角色不可禁用' : undefined}
                  onClick={() => setTogglingStatus(role)}
                >
                  禁用
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canEnable}
                  onClick={() => setTogglingStatus(role)}
                >
                  启用
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [canUpdate, canSetPermissions, canDisable, canEnable],
  )

  return (
    <ListPageLayout
      title="角色与权限矩阵"
      description="配置系统扁平角色，通过静态权限目录进行整量替换授权。super_admin 是系统唯一保留角色。"
      breadcrumb={[{ label: '系统运维' }, { label: '运营权限', href: '/operations' }, { label: '角色管理' }]}
      actions={
        <Button disabled={!canCreate} onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 size-4" />
          新建角色
        </Button>
      }
    >
      <div className="p-4">
        <PermissionContract
          read={OPERATIONS_PERMISSIONS.rolesRead}
          write={OPERATIONS_PERMISSIONS.rolesCreate}
        />
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => query.refetch()}
          getRowId={(row) => row.role_id}
          emptyTitle="暂无角色"
          emptyDescription="具备创建权限时可添加自定义角色。"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          规范说明：V1 采用扁平授权模型（Flat RBAC），无角色继承树与 Deny 规则。
        </p>
      </div>

      {/* Create Dialog */}
      <CreateRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false)
          toast.success({ title: '角色创建成功', description: '新角色已创建，请为其配置权限矩阵。' })
        }}
        onError={fail}
      />

      {/* Edit Dialog */}
      {editing ? (
        <EditRoleDialog
          role={editing}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          onSuccess={() => {
            setEditing(null)
            toast.success({ title: '更新成功', description: '角色信息已更新。' })
          }}
          onError={fail}
        />
      ) : null}

      {/* Toggle Status Confirm */}
      {togglingStatus ? (
        <ConfirmDialog
          open={Boolean(togglingStatus)}
          onOpenChange={(open) => !open && setTogglingStatus(null)}
          title={togglingStatus.status === 'active' ? '确认禁用角色？' : '确认启用角色？'}
          description={
            togglingStatus.status === 'active'
              ? `禁用后，已关联该角色 "${togglingStatus.name}" 的所有操作员将不再获得该角色赋予的权限。`
              : `启用后，已关联该角色 "${togglingStatus.name}" 的所有操作员将恢复对应权限。`
          }
          destructive={togglingStatus.status === 'active'}
          confirmLabel={togglingStatus.status === 'active' ? '确认禁用' : '确认启用'}
          loading={disableMutation.isPending || enableMutation.isPending}
          onConfirm={async () => {
            try {
              if (togglingStatus.status === 'active') {
                await disableMutation.mutateAsync(togglingStatus.role_id)
                toast.success({ title: '已禁用角色', description: `角色 ${togglingStatus.name} 已停用。` })
              } else {
                await enableMutation.mutateAsync(togglingStatus.role_id)
                toast.success({ title: '已启用角色', description: `角色 ${togglingStatus.name} 已恢复激活。` })
              }
              setTogglingStatus(null)
            } catch (err) {
              fail(err)
            }
          }}
        />
      ) : null}

      {/* Permission Matrix Modal */}
      {configuringRole ? (
        <PermissionMatrixModal
          role={configuringRole}
          open={Boolean(configuringRole)}
          onOpenChange={(open) => !open && setConfiguringRole(null)}
          catalog={catalogQuery.data ?? []}
          canSetPermissions={canSetPermissions}
        />
      ) : null}
    </ListPageLayout>
  )
}

/* ---------- Dialogs & Permission Matrix ---------- */

function CreateRoleDialog({
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
  const mutation = useCreateRole()
  const form = useForm<RoleCreateInput>({
    resolver: zodResolver(roleCreateInputSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
    },
  })

  React.useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  const onSubmit = async (values: RoleCreateInput) => {
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
          <DialogTitle>新建角色</DialogTitle>
          <DialogDescription>创建新的自定义后台管理角色。</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="角色标识 (code)"
            htmlFor="code"
            error={form.formState.errors.code?.message}
            hint="唯一小写蛇形标识，如 content_editor、finance_reviewer，创建后不可修改。"
          >
            <Input id="code" placeholder="例如 support_staff" {...form.register('code')} />
          </FormField>
          <FormField
            label="角色名称"
            htmlFor="name"
            error={form.formState.errors.name?.message}
          >
            <Input id="name" placeholder="例如 客服专员" {...form.register('name')} />
          </FormField>
          <FormField
            label="描述 (可选)"
            htmlFor="description"
            error={form.formState.errors.description?.message}
          >
            <Textarea id="description" placeholder="角色职责描述..." {...form.register('description')} />
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

function EditRoleDialog({
  role,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: {
  role: RoleSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onError: (error: unknown) => void
}) {
  const mutation = useUpdateRole()
  const form = useForm<RoleUpdateInput>({
    resolver: zodResolver(roleUpdateInputSchema),
    defaultValues: {
      name: role.name,
      description: role.description ?? '',
    },
  })

  const onSubmit = async (values: RoleUpdateInput) => {
    try {
      await mutation.mutateAsync({ roleId: role.role_id, input: values })
      onSuccess()
    } catch (err) {
      onError(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑角色 — {role.code}</DialogTitle>
          <DialogDescription>修改角色名称与描述（角色标识 Code 严格不可变）。</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="角色名称"
            htmlFor="edit_name"
            error={form.formState.errors.name?.message}
          >
            <Input id="edit_name" {...form.register('name')} />
          </FormField>
          <FormField
            label="描述"
            htmlFor="edit_description"
            error={form.formState.errors.description?.message}
          >
            <Textarea id="edit_description" {...form.register('description')} />
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

function PermissionMatrixModal({
  role,
  open,
  onOpenChange,
  catalog,
  canSetPermissions,
}: {
  role: RoleSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog: PermissionCatalogItem[]
  canSetPermissions: boolean
}) {
  const toast = useToastApi()
  const permissionsQuery = useRolePermissionsQuery(role.role_id)
  const mutation = useSetRolePermissions()

  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set())

  // Sync initial permissions
  React.useEffect(() => {
    if (permissionsQuery.data) {
      setSelectedKeys(new Set(permissionsQuery.data))
    }
  }, [permissionsQuery.data])

  // Group catalog by domain -> resource
  const groupedCatalog = React.useMemo(() => {
    const map = new Map<string, Map<string, PermissionCatalogItem[]>>()
    for (const item of catalog) {
      if (!map.has(item.domain)) {
        map.set(item.domain, new Map())
      }
      const resourceMap = map.get(item.domain)!
      if (!resourceMap.has(item.resource)) {
        resourceMap.set(item.resource, [])
      }
      resourceMap.get(item.resource)!.push(item)
    }
    return map
  }, [catalog])

  const toggleKey = (key: string) => {
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelectedKeys(next)
  }

  const toggleDomain = (domain: string, selectAll: boolean) => {
    const next = new Set(selectedKeys)
    for (const item of catalog) {
      if (item.domain === domain) {
        if (selectAll) next.add(item.key)
        else next.delete(item.key)
      }
    }
    setSelectedKeys(next)
  }

  const handleSave = async () => {
    try {
      const keys = Array.from(selectedKeys)
      const res = await mutation.mutateAsync({
        roleId: role.role_id,
        permissionKeys: keys,
      })
      toast.success({
        title: '权限配置已保存',
        description: `已整量更新为 ${res.permissions.length} 个权限项。`,
      })
      onOpenChange(false)
    } catch (err) {
      toast.error({ title: '保存权限失败', description: mutationErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            配置角色权限矩阵 — {role.name} ({role.code})
          </DialogTitle>
          <DialogDescription>
            采用全量替换语义（SetRolePermissions）。共勾选 {selectedKeys.size} / {catalog.length} 项权限。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
          {Array.from(groupedCatalog.entries()).map(([domain, resources]) => {
            const domainItems = catalog.filter((c) => c.domain === domain)
            const allDomainSelected = domainItems.every((c) => selectedKeys.has(c.key))

            return (
              <div key={domain} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold capitalize text-base">{domain} 域</span>
                    <span className="text-xs text-muted-foreground">({domainItems.length} 项能力)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => toggleDomain(domain, !allDomainSelected)}
                  >
                    {allDomainSelected ? '取消全选本域' : '全选本域'}
                  </Button>
                </div>

                <div className="space-y-4">
                  {Array.from(resources.entries()).map(([resource, items]) => (
                    <div key={resource} className="space-y-1.5 pl-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        资源: {resource}
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {items.map((item) => {
                          const checked = selectedKeys.has(item.key)
                          return (
                            <label
                              key={item.key}
                              className={`flex cursor-pointer items-center gap-2 rounded border p-2 text-xs transition-colors hover:bg-muted/40 ${
                                checked ? 'border-primary/50 bg-primary/5 font-medium' : 'border-border'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleKey(item.key)}
                                className="rounded text-primary focus:ring-primary"
                              />
                              <span className="truncate">{item.key}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            保存后，关联该角色的操作员在下一次 API 调用时立即生效。
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button disabled={!canSetPermissions || mutation.isPending} onClick={handleSave}>
              {mutation.isPending ? '保存中...' : '确认保存权限'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
