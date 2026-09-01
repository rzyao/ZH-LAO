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
  RUNTIME_CONFIG_REGISTRY,
  runtimeConfigEditSchema,
  statusTone,
  type RuntimeConfig,
  type RuntimeConfigEditInput,
} from '../contracts'
import { useRetireRuntimeConfig, useRuntimeConfigsQuery, useSetRuntimeConfig } from '../queries'
import { FormField, PermissionContract, formatDateTime, isConflictError, mutationErrorMessage, useExactPermission } from '../components'

export function RuntimeConfigsPage() {
  const query = useRuntimeConfigsQuery()
  const canWrite = useExactPermission(PLATFORM_PERMISSIONS.runtimeConfigsWrite)
  const toast = useToastApi()
  const setMutation = useSetRuntimeConfig()
  const retireMutation = useRetireRuntimeConfig()
  const [editing, setEditing] = React.useState<RuntimeConfig | null>(null)
  const [retiring, setRetiring] = React.useState<RuntimeConfig | null>(null)

  const definitions = React.useMemo(() => new Map(RUNTIME_CONFIG_REGISTRY.map((entry) => [entry.key, entry])), [])
  const columns = React.useMemo<ColumnDef<RuntimeConfig>[]>(() => [
    { accessorKey: 'key', header: '配置项 Key', cell: ({ row }) => <code className="text-xs">{row.original.key}</code> },
    { accessorKey: 'value_type', header: '值类型' },
    { id: 'visibility', header: '可见性', cell: ({ row }) => definitions.get(row.original.key as never)?.visibility ?? '未注册' },
    { accessorKey: 'value', header: '当前配置值', cell: ({ row }) => <span className="block max-w-80 truncate font-mono text-xs">{typeof row.original.value === 'string' ? row.original.value : JSON.stringify(row.original.value)}</span> },
    { accessorKey: 'status', header: '状态', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    { accessorKey: 'updated_at', header: '更新时间', cell: ({ row }) => formatDateTime(row.original.updated_at) },
    {
      id: 'actions', header: '操作', cell: ({ row }) => {
        const config = row.original
        const registered = definitions.has(config.key as never)
        const retired = config.status === 'retired'
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={!canWrite || !registered || retired} onClick={() => setEditing(config)}>编辑</Button>
            <Button size="sm" variant="destructive" disabled={!canWrite || !registered || retired} onClick={() => setRetiring(config)}>废弃</Button>
          </div>
        )
      },
    },
  ], [canWrite, definitions])

  const onError = async (error: unknown) => {
    if (isConflictError(error)) {
      await query.refetch()
      toast.warning({
        title: '配置数据已发生并发变更',
        description: '已自动拉取最新配置数据。请核对当前值与更新时间后再提交修改。未产生静默覆盖。',
      })
      return
    }
    toast.error({ title: '运行时配置操作失败', description: mutationErrorMessage(error) })
  }

  return (
    <ListPageLayout
      title="运行时配置治理"
      description="仅支持编辑代码注册表中已声明的强类型配置项。禁止随意写入无模式的任意 JSON 数据。"
      breadcrumb={[{ label: '系统运维' }, { label: '平台控制台', href: '/platform' }, { label: '运行时配置' }]}
    >
      <div className="p-4">
        <PermissionContract read={PLATFORM_PERMISSIONS.runtimeConfigsRead} write={PLATFORM_PERMISSIONS.runtimeConfigsWrite} />
        <div className="mb-3 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          已注册的 V1 配置项：{RUNTIME_CONFIG_REGISTRY.map((entry) => `${entry.key} (${entry.valueType}, ${entry.visibility})`).join(' · ')}
        </div>
        <DataTable columns={columns} data={query.data ?? []} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => row.key} emptyTitle="暂无运行时配置行" emptyDescription="若未单独写入数据库，则沿用注册表中的代码默认回退值。" />
      </div>

      <RuntimeConfigDialog
        config={editing}
        pending={setMutation.isPending}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(input) => setMutation.mutate(input, {
          onSuccess: () => { setEditing(null); toast.success({ title: '运行时配置已更新' }) },
          onError,
        })}
      />
      <ConfirmDialog
        open={Boolean(retiring)}
        onOpenChange={(open) => !open && setRetiring(null)}
        title="确认废弃此运行时配置？"
        description="废弃操作不可逆。下线后业务端将自动使用注册表默认回退值或 CONFIG_UNAVAILABLE 语义。"
        destructive
        confirmLabel="确认废弃"
        loading={retireMutation.isPending}
        onConfirm={() => retiring && retireMutation.mutate(retiring.key, {
          onSuccess: () => { setRetiring(null); toast.success({ title: '运行时配置已废弃' }) },
          onError,
        })}
      />
    </ListPageLayout>
  )
}

function RuntimeConfigDialog({ config, pending, onOpenChange, onSubmit }: { config: RuntimeConfig | null; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (input: RuntimeConfigEditInput) => void }) {
  const form = useForm<RuntimeConfigEditInput>({
    resolver: zodResolver(runtimeConfigEditSchema),
    defaultValues: { key: 'default_locale', value: '', description: '', expected_updated_at: '' },
  })
  React.useEffect(() => {
    if (!config) return
    const definition = RUNTIME_CONFIG_REGISTRY.find((entry) => entry.key === config.key)
    if (!definition) return
    form.reset({
      key: definition.key,
      value: typeof config.value === 'string' ? config.value : '',
      description: config.description ?? '',
      expected_updated_at: config.updated_at,
    })
  }, [config, form])
  const definition = config ? RUNTIME_CONFIG_REGISTRY.find((entry) => entry.key === config.key) : undefined
  return (
    <Dialog open={Boolean(config && definition)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>编辑运行时配置</DialogTitle><DialogDescription>Key 与数据类型不可修改。并发版本号用于防范脏写。</DialogDescription></DialogHeader>
        <form id="runtime-config-form" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="配置项 Key" htmlFor="rc-key"><Input id="rc-key" value={definition?.key ?? ''} disabled /></FormField>
          <FormField label="值类型 (Value Type)" htmlFor="rc-type"><Input id="rc-type" value={definition?.valueType ?? ''} disabled /></FormField>
          <FormField label="配置值" htmlFor="rc-value" error={form.formState.errors.value?.message}><Input id="rc-value" {...form.register('value')} /></FormField>
          <FormField label="说明" htmlFor="rc-description"><Textarea id="rc-description" {...form.register('description')} /></FormField>
          <FormField label="期望版本更新时间" htmlFor="rc-updated" hint="用于并发冲突保护的版本时间戳令牌（只读）。"><Input id="rc-updated" value={form.watch('expected_updated_at') ?? ''} disabled /></FormField>
        </form>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="runtime-config-form" loading={pending}>保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
