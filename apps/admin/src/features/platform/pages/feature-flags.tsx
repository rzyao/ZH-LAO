import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
  PLATFORM_PERMISSIONS,
  featureFlagCreateSchema,
  featureFlagOverrideInputSchema,
  featureFlagUpdateSchema,
  statusTone,
  type FeatureFlag,
  type FeatureFlagCreateInput,
  type FeatureFlagOverrideInput,
  type FeatureFlagUpdateInput,
} from '../contracts'
import {
  useCreateFeatureFlag,
  useFeatureFlagsQuery,
  useRemoveFeatureFlagOverride,
  useRetireFeatureFlag,
  useSetFeatureFlagOverride,
  useUpdateFeatureFlag,
} from '../queries'
import { FormField, NativeSelect, PermissionContract, mutationErrorMessage, useExactPermission } from '../components'

export function FeatureFlagsPage() {
  const query = useFeatureFlagsQuery()
  const canWrite = useExactPermission(PLATFORM_PERMISSIONS.featureFlagsWrite)
  const toast = useToastApi()
  const createMutation = useCreateFeatureFlag()
  const updateMutation = useUpdateFeatureFlag()
  const retireMutation = useRetireFeatureFlag()
  const setOverrideMutation = useSetFeatureFlagOverride()
  const removeOverrideMutation = useRemoveFeatureFlagOverride()
  const [editing, setEditing] = React.useState<FeatureFlag | null>(null)
  const [overrideFlag, setOverrideFlag] = React.useState<FeatureFlag | null>(null)
  const [retiring, setRetiring] = React.useState<FeatureFlag | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)

  const columns = React.useMemo<ColumnDef<FeatureFlag>[]>(() => [
    { accessorKey: 'key', header: '键名 (Key)', cell: ({ row }) => <code className="text-xs">{row.original.key}</code> },
    { accessorKey: 'name', header: '名称' },
    { accessorKey: 'default_enabled', header: '默认状态', cell: ({ row }) => row.original.default_enabled ? '默认开启' : '默认关闭' },
    { accessorKey: 'status', header: '状态', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    {
      id: 'overrides', header: '覆盖规则数', cell: ({ row }) => {
        const overrides = row.original.overrides
        if (!overrides) return <span className="text-xs text-muted-foreground">暂无覆盖</span>
        return <span>{overrides.length}</span>
      },
    },
    {
      id: 'actions', header: '操作', enableSorting: false, cell: ({ row }) => {
        const flag = row.original
        const retired = flag.status === 'retired'
        return (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" disabled={!canWrite || retired} onClick={() => setEditing(flag)}>编辑</Button>
            <Button size="sm" variant="outline" disabled={!canWrite || retired} onClick={() => setOverrideFlag(flag)}>灰度覆盖</Button>
            <Button size="sm" variant="destructive" disabled={!canWrite || retired} onClick={() => setRetiring(flag)}>废弃</Button>
          </div>
        )
      },
    },
  ], [canWrite])

  const fail = (error: unknown) => toast.error({ title: '功能开关操作失败', description: mutationErrorMessage(error) })

  return (
    <ListPageLayout
      title="功能开关治理"
      description="管理全局默认开关状态与按地区/客户端维度的灰度覆盖规则。开关 Key 唯一不可变，废弃后不可重新激活。"
      breadcrumb={[{ label: '系统运维' }, { label: '平台控制台', href: '/platform' }, { label: '功能开关' }]}
      actions={<Button disabled={!canWrite} onClick={() => setCreateOpen(true)}>新建开关</Button>}
    >
      <div className="p-4">
        <PermissionContract read={PLATFORM_PERMISSIONS.featureFlagsRead} write={PLATFORM_PERMISSIONS.featureFlagsWrite} />
        <DataTable
          columns={columns}
          data={query.data ?? []}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => query.refetch()}
          getRowId={(row) => row.key}
          emptyTitle="暂无功能开关"
          emptyDescription="具备写入权限时可创建首个平台功能开关。"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          覆盖规则仅支持按地区代码 (region_code) 和客户端平台 (client_platform) 进行限定，不支持无作用域的全局覆盖。
        </p>
      </div>

      <CreateFlagDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        pending={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate(input, {
          onSuccess: () => { setCreateOpen(false); toast.success({ title: '功能开关已创建' }) },
          onError: fail,
        })}
      />
      <EditFlagDialog
        flag={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        pending={updateMutation.isPending}
        onSubmit={(input) => editing && updateMutation.mutate({ key: editing.key, input }, {
          onSuccess: () => { setEditing(null); toast.success({ title: '功能开关已更新' }) },
          onError: fail,
        })}
      />
      <OverrideDialog
        flag={overrideFlag}
        onOpenChange={(open) => !open && setOverrideFlag(null)}
        pending={setOverrideMutation.isPending || removeOverrideMutation.isPending}
        onSet={(input) => overrideFlag && setOverrideMutation.mutate({ key: overrideFlag.key, input }, {
          onSuccess: () => { setOverrideFlag(null); toast.success({ title: '覆盖规则已保存' }) },
          onError: fail,
        })}
        onRemove={(input) => overrideFlag && removeOverrideMutation.mutate({ key: overrideFlag.key, input }, {
          onSuccess: () => { setOverrideFlag(null); toast.success({ title: '覆盖规则已移除' }) },
          onError: fail,
        })}
      />
      <ConfirmDialog
        open={Boolean(retiring)}
        onOpenChange={(open) => !open && setRetiring(null)}
        title="确认废弃此功能开关？"
        description="废弃操作不可逆。该 Key 将作为历史归档保留，不能再次重新激活。"
        confirmLabel="确认废弃"
        destructive
        loading={retireMutation.isPending}
        onConfirm={() => retiring && retireMutation.mutate(retiring.key, {
          onSuccess: () => { setRetiring(null); toast.success({ title: '功能开关已废弃' }) },
          onError: fail,
        })}
      />
    </ListPageLayout>
  )
}

function CreateFlagDialog({ open, onOpenChange, pending, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: FeatureFlagCreateInput) => void }) {
  const form = useForm<FeatureFlagCreateInput>({ resolver: zodResolver(featureFlagCreateSchema), defaultValues: { key: '', name: '', description: '', default_enabled: false } })
  React.useEffect(() => { if (!open) form.reset() }, [open, form])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>新建功能开关</DialogTitle><DialogDescription>初始状态为激活态。Key 创建后不可修改。</DialogDescription></DialogHeader>
        <form id="create-feature-flag" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="键名 (Key)" htmlFor="ff-key" error={form.formState.errors.key?.message}><Input id="ff-key" {...form.register('key')} placeholder="例：learning.new_review_mode" /></FormField>
          <FormField label="名称" htmlFor="ff-name" error={form.formState.errors.name?.message}><Input id="ff-name" {...form.register('name')} placeholder="开关显示名称" /></FormField>
          <FormField label="说明" htmlFor="ff-description" error={form.formState.errors.description?.message}><Textarea id="ff-description" {...form.register('description')} placeholder="功能开关用途说明" /></FormField>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('default_enabled')} /> 默认启用</label>
        </form>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="create-feature-flag" loading={pending}>创建</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditFlagDialog({ flag, onOpenChange, pending, onSubmit }: { flag: FeatureFlag | null; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: FeatureFlagUpdateInput) => void }) {
  const form = useForm<FeatureFlagUpdateInput>({ resolver: zodResolver(featureFlagUpdateSchema), defaultValues: { name: '', description: '', default_enabled: false, status: 'active' } })
  React.useEffect(() => { if (flag) form.reset({ name: flag.name, description: flag.description ?? '', default_enabled: flag.default_enabled, status: flag.status === 'inactive' ? 'inactive' : 'active' }) }, [flag, form])
  return (
    <Dialog open={Boolean(flag)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>编辑功能开关</DialogTitle><DialogDescription>Key 保持只读。可自由切换 active/inactive 状态。</DialogDescription></DialogHeader>
        <form id="edit-feature-flag" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="键名 (Key)" htmlFor="ff-edit-key"><Input id="ff-edit-key" value={flag?.key ?? ''} disabled /></FormField>
          <FormField label="名称" htmlFor="ff-edit-name" error={form.formState.errors.name?.message}><Input id="ff-edit-name" {...form.register('name')} /></FormField>
          <FormField label="说明" htmlFor="ff-edit-description"><Textarea id="ff-edit-description" {...form.register('description')} /></FormField>
          <FormField label="状态" htmlFor="ff-edit-status"><NativeSelect id="ff-edit-status" {...form.register('status')}><option value="active">active (启用)</option><option value="inactive">inactive (停用)</option></NativeSelect></FormField>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('default_enabled')} /> 默认启用</label>
        </form>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="edit-feature-flag" loading={pending}>保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OverrideDialog({ flag, onOpenChange, pending, onSet, onRemove }: { flag: FeatureFlag | null; onOpenChange: (open: boolean) => void; pending: boolean; onSet: (input: FeatureFlagOverrideInput) => void; onRemove: (input: Omit<FeatureFlagOverrideInput, 'enabled'>) => void }) {
  const form = useForm<FeatureFlagOverrideInput>({ resolver: zodResolver(featureFlagOverrideInputSchema), defaultValues: { region_code: '', client_platform: '', enabled: false } })
  React.useEffect(() => { if (!flag) form.reset({ region_code: '', client_platform: '', enabled: false }) }, [flag, form])
  const values = form.watch()
  return (
    <Dialog open={Boolean(flag)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>按范围灰度覆盖</DialogTitle><DialogDescription>必须至少指定一个作用域（地区或客户端平台）。</DialogDescription></DialogHeader>
        <form id="feature-override" className="space-y-3" onSubmit={form.handleSubmit(onSet)}>
          <FormField label="地区代码 (Region Code)" htmlFor="ff-region" error={form.formState.errors.region_code?.message}><Input id="ff-region" placeholder="例：LA" {...form.register('region_code')} /></FormField>
          <FormField label="客户端平台" htmlFor="ff-client"><NativeSelect id="ff-client" {...form.register('client_platform')}><option value="">全部平台</option><option value="android">Android</option><option value="ios">iOS</option></NativeSelect></FormField>
          {form.formState.errors.root?.message ? <p className="text-xs text-destructive">{form.formState.errors.root.message}</p> : null}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('enabled')} /> 在此作用域内启用开关</label>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={pending || (!values.region_code && !values.client_platform)} onClick={() => onRemove({ region_code: values.region_code, client_platform: values.client_platform })}>移除该规则</Button>
          <Button type="submit" form="feature-override" loading={pending}>保存覆盖规则</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
