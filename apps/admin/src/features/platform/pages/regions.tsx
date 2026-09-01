import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table/data-table'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusBadge } from '@/components/common/status-badge'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useToastApi } from '@/components/feedback/use-toast'
import { PLATFORM_PERMISSIONS, regionCreateSchema, regionUpdateSchema, statusTone, type Region, type RegionCreateInput, type RegionUpdateInput } from '../contracts'
import { useCreateRegion, useRegionsQuery, useRetireRegion, useUpdateRegion } from '../queries'
import { FormField, NativeSelect, PermissionContract, mutationErrorMessage, useExactPermission } from '../components'

export function RegionsPage() {
  const query = useRegionsQuery()
  const canWrite = useExactPermission(PLATFORM_PERMISSIONS.regionsWrite)
  const toast = useToastApi()
  const createMutation = useCreateRegion()
  const updateMutation = useUpdateRegion()
  const retireMutation = useRetireRegion()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Region | null>(null)
  const [retiring, setRetiring] = React.useState<Region | null>(null)
  const fail = (error: unknown) => toast.error({ title: '地区策略操作失败', description: mutationErrorMessage(error) })

  const columns = React.useMemo<ColumnDef<Region>[]>(() => [
    { accessorKey: 'code', header: '地区代码 (Code)', cell: ({ row }) => <code className="text-xs">{row.original.code}</code> },
    { accessorKey: 'name', header: '地区名称' },
    { accessorKey: 'default_locale', header: '默认语言/区域 (Locale)' },
    { accessorKey: 'timezone', header: '时区 (Timezone)' },
    { accessorKey: 'status', header: '状态', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    { id: 'actions', header: '操作', cell: ({ row }) => <div className="flex gap-1"><Button size="sm" variant="outline" disabled={!canWrite || row.original.status === 'retired'} onClick={() => setEditing(row.original)}>编辑</Button><Button size="sm" variant="destructive" disabled={!canWrite || row.original.status === 'retired'} onClick={() => setRetiring(row.original)}>废弃</Button></div> },
  ], [canWrite])

  return <ListPageLayout title="支持地区管理" description="仅用于平台产品业务覆盖地区。地区代码唯一且不可变，废弃操作为终态。" breadcrumb={[{ label: '系统运维' }, { label: '平台控制台', href: '/platform' }, { label: '地区管理' }]} actions={<Button disabled={!canWrite} onClick={() => setCreateOpen(true)}>新建地区</Button>}>
    <div className="p-4"><PermissionContract read={PLATFORM_PERMISSIONS.regionsRead} write={PLATFORM_PERMISSIONS.regionsWrite} /><DataTable columns={columns} data={query.data ?? []} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => row.code} emptyTitle="暂无地区配置" /></div>
    <CreateRegionDialog open={createOpen} onOpenChange={setCreateOpen} pending={createMutation.isPending} onSubmit={(input) => createMutation.mutate(input, { onSuccess: () => { setCreateOpen(false); toast.success({ title: '地区已创建' }) }, onError: fail })} />
    <EditRegionDialog row={editing} onOpenChange={(open) => !open && setEditing(null)} pending={updateMutation.isPending} onSubmit={(input) => editing && updateMutation.mutate({ code: editing.code, input }, { onSuccess: () => { setEditing(null); toast.success({ title: '地区配置已更新' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(retiring)} onOpenChange={(open) => !open && setRetiring(null)} title="确认废弃该地区？" description="废弃操作不可逆。该代码将作为历史数据归档保留，不会物理删除。" confirmLabel="确认废弃" destructive loading={retireMutation.isPending} onConfirm={() => retiring && retireMutation.mutate(retiring.code, { onSuccess: () => { setRetiring(null); toast.success({ title: '地区已废弃' }) }, onError: fail })} />
  </ListPageLayout>
}

function CreateRegionDialog({ open, onOpenChange, pending, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: RegionCreateInput) => void }) {
  const form = useForm<RegionCreateInput>({ resolver: zodResolver(regionCreateSchema), defaultValues: { code: '', name: '', default_locale: '', timezone: '' } })
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>新建支持地区</DialogTitle><DialogDescription>初始状态为激活态。请勿混淆用户个人资料中的地理位置概念。</DialogDescription></DialogHeader><form id="region-create" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="地区代码 (Code)" htmlFor="region-code" error={form.formState.errors.code?.message}><Input id="region-code" placeholder="例：LA" {...form.register('code')} /></FormField><FormField label="地区名称" htmlFor="region-name"><Input id="region-name" {...form.register('name')} placeholder="例：老挝" /></FormField><FormField label="默认区域 (Locale)" htmlFor="region-locale"><Input id="region-locale" placeholder="例：lo-LA" {...form.register('default_locale')} /></FormField><FormField label="时区 (Timezone)" htmlFor="region-timezone"><Input id="region-timezone" placeholder="例：Asia/Vientiane" {...form.register('timezone')} /></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="region-create" loading={pending}>创建地区</Button></DialogFooter></DialogContent></Dialog>
}

function EditRegionDialog({ row, onOpenChange, pending, onSubmit }: { row: Region | null; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: RegionUpdateInput) => void }) {
  const form = useForm<RegionUpdateInput>({ resolver: zodResolver(regionUpdateSchema), defaultValues: { name: '', default_locale: '', timezone: '', status: 'active' } })
  React.useEffect(() => { if (row) form.reset({ name: row.name, default_locale: row.default_locale, timezone: row.timezone, status: row.status === 'inactive' ? 'inactive' : 'active' }) }, [row, form])
  return <Dialog open={Boolean(row)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>编辑地区配置</DialogTitle><DialogDescription>地区代码保持只读不可变。状态 active/inactive 可随时切换。</DialogDescription></DialogHeader><form id="region-edit" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="地区代码 (Code)" htmlFor="region-edit-code"><Input id="region-edit-code" value={row?.code ?? ''} disabled /></FormField><FormField label="地区名称" htmlFor="region-edit-name"><Input id="region-edit-name" {...form.register('name')} /></FormField><FormField label="默认区域 (Locale)" htmlFor="region-edit-locale"><Input id="region-edit-locale" {...form.register('default_locale')} /></FormField><FormField label="时区 (Timezone)" htmlFor="region-edit-timezone"><Input id="region-edit-timezone" {...form.register('timezone')} /></FormField><FormField label="状态" htmlFor="region-edit-status"><NativeSelect id="region-edit-status" {...form.register('status')}><option value="active">active (启用)</option><option value="inactive">inactive (停用)</option></NativeSelect></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="region-edit" loading={pending}>保存配置</Button></DialogFooter></DialogContent></Dialog>
}
