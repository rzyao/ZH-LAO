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
  appVersionCreateSchema,
  appVersionDraftUpdateSchema,
  appVersionPolicySchema,
  statusTone,
  type AppVersion,
  type AppVersionCreateInput,
  type AppVersionDraftUpdateInput,
  type AppVersionPolicyInput,
  type ClientPlatform,
} from '../contracts'
import {
  useAppVersionsQuery,
  useCreateAppVersion,
  useDeleteAppVersionDraft,
  usePublishAppVersion,
  useUpdateAppVersionDraft,
  useUpdateAppVersionPolicy,
} from '../queries'
import { FormField, NativeSelect, PermissionContract, formatDateTime, mutationErrorMessage, useExactPermission } from '../components'

export function AppVersionsPage() {
  const [platform, setPlatform] = React.useState<ClientPlatform | undefined>()
  const query = useAppVersionsQuery(platform)
  const canWrite = useExactPermission(PLATFORM_PERMISSIONS.appVersionsWrite)
  const toast = useToastApi()
  const createMutation = useCreateAppVersion()
  const draftMutation = useUpdateAppVersionDraft()
  const publishMutation = usePublishAppVersion()
  const policyMutation = useUpdateAppVersionPolicy()
  const deleteMutation = useDeleteAppVersionDraft()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [draftRow, setDraftRow] = React.useState<AppVersion | null>(null)
  const [policyRow, setPolicyRow] = React.useState<AppVersion | null>(null)
  const [publishRow, setPublishRow] = React.useState<AppVersion | null>(null)
  const [deleteRow, setDeleteRow] = React.useState<AppVersion | null>(null)
  const fail = (error: unknown) => toast.error({ title: '版本管理操作失败', description: mutationErrorMessage(error) })

  const columns = React.useMemo<ColumnDef<AppVersion>[]>(() => [
    { accessorKey: 'client_platform', header: '客户端平台' },
    { accessorKey: 'version', header: '版本展示名' },
    { accessorKey: 'build_number', header: '构建号 (Build Number)' },
    { accessorKey: 'status', header: '状态', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    { accessorKey: 'update_policy', header: '更新策略' },
    { accessorKey: 'released_at', header: '发布时间', cell: ({ row }) => formatDateTime(row.original.released_at) },
    { accessorKey: 'release_notes', header: '更新日志', cell: ({ row }) => <span className="block max-w-64 truncate">{row.original.release_notes ?? '—'}</span> },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="outline" disabled={!canWrite || row.original.status !== 'draft'} onClick={() => setDraftRow(row.original)}>编辑草稿</Button>
          <Button size="sm" variant="outline" disabled={!canWrite || row.original.status !== 'draft'} onClick={() => setPublishRow(row.original)}>发布</Button>
          <Button size="sm" variant="outline" disabled={!canWrite || row.original.status === 'draft'} onClick={() => setPolicyRow(row.original)}>策略调整</Button>
          <Button size="sm" variant="destructive" disabled={!canWrite || row.original.status !== 'draft' || row.original.released_at !== null} onClick={() => setDeleteRow(row.original)}>删除草稿</Button>
        </div>
      ),
    },
  ], [canWrite])

  return <ListPageLayout title="客户端版本治理" description="版本排序与策略严格基于数值型 build_number 进行判定；版本号字符串仅作展示。" breadcrumb={[{ label: '系统运维' }, { label: '平台控制台', href: '/platform' }, { label: '客户端版本' }]} actions={<Button disabled={!canWrite} onClick={() => setCreateOpen(true)}>新建版本草稿</Button>}>
    <div className="p-4">
      <PermissionContract read={PLATFORM_PERMISSIONS.appVersionsRead} write={PLATFORM_PERMISSIONS.appVersionsWrite} />
      <div className="mb-3 max-w-48"><NativeSelect aria-label="筛选客户端平台" value={platform ?? ''} onChange={(event) => setPlatform((event.target.value || undefined) as ClientPlatform | undefined)}><option value="">全部平台</option><option value="android">Android</option><option value="ios">iOS</option></NativeSelect></div>
      <DataTable columns={columns} data={query.data ?? []} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => `${row.client_platform}:${row.build_number}`} emptyTitle="暂无客户端版本" />
    </div>
    <CreateVersionDialog open={createOpen} onOpenChange={setCreateOpen} pending={createMutation.isPending} onSubmit={(input) => createMutation.mutate(input, { onSuccess: () => { setCreateOpen(false); toast.success({ title: '版本草稿已创建' }) }, onError: fail })} />
    <DraftVersionDialog row={draftRow} onOpenChange={(open) => !open && setDraftRow(null)} pending={draftMutation.isPending} onSubmit={(input) => draftRow && draftMutation.mutate({ platform: draftRow.client_platform, buildNumber: draftRow.build_number, input }, { onSuccess: () => { setDraftRow(null); toast.success({ title: '版本草稿已更新' }) }, onError: fail })} />
    <PolicyDialog row={policyRow} onOpenChange={(open) => !open && setPolicyRow(null)} pending={policyMutation.isPending} onSubmit={(input) => policyRow && policyMutation.mutate({ platform: policyRow.client_platform, buildNumber: policyRow.build_number, input }, { onSuccess: () => { setPolicyRow(null); toast.success({ title: '更新策略已保存' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(publishRow)} onOpenChange={(open) => !open && setPublishRow(null)} title="确认发布此客户端版本？" description="发布操作将立即使该构建生效，不支持定时排期发布。" confirmLabel="确认发布" loading={publishMutation.isPending} onConfirm={() => publishRow && publishMutation.mutate({ platform: publishRow.client_platform, buildNumber: publishRow.build_number }, { onSuccess: () => { setPublishRow(null); toast.success({ title: '版本已正式发布' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(deleteRow)} onOpenChange={(open) => !open && setDeleteRow(null)} title="确认删除此草稿？" description="仅允许删除从未发布过的草稿版本。" confirmLabel="删除草稿" destructive loading={deleteMutation.isPending} onConfirm={() => deleteRow && deleteMutation.mutate({ platform: deleteRow.client_platform, buildNumber: deleteRow.build_number }, { onSuccess: () => { setDeleteRow(null); toast.success({ title: '版本草稿已删除' }) }, onError: fail })} />
  </ListPageLayout>
}

function CreateVersionDialog({ open, onOpenChange, pending, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: AppVersionCreateInput) => void }) {
  const form = useForm<AppVersionCreateInput>({ resolver: zodResolver(appVersionCreateSchema), defaultValues: { client_platform: 'android', version: '', build_number: 1, release_notes: '' } })
  React.useEffect(() => { if (!open) form.reset({ client_platform: 'android', version: '', build_number: 1, release_notes: '' }) }, [open, form])
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>新建客户端版本草稿</DialogTitle><DialogDescription>当前冻结契约不支持渠道包、灰度比例及定时发布字段。</DialogDescription></DialogHeader><form id="app-version-create" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="客户端平台" htmlFor="av-platform"><NativeSelect id="av-platform" {...form.register('client_platform')}><option value="android">Android</option><option value="ios">iOS</option></NativeSelect></FormField><FormField label="版本展示名" htmlFor="av-version" error={form.formState.errors.version?.message}><Input id="av-version" {...form.register('version')} placeholder="例：v1.2.0" /></FormField><FormField label="构建号 (Build Number)" htmlFor="av-build" error={form.formState.errors.build_number?.message}><Input id="av-build" type="number" {...form.register('build_number', { valueAsNumber: true })} placeholder="递增正整数" /></FormField><FormField label="更新日志" htmlFor="av-notes"><Textarea id="av-notes" {...form.register('release_notes')} placeholder="版本更新内容说明" /></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="app-version-create" loading={pending}>创建草稿</Button></DialogFooter></DialogContent></Dialog>
}

function DraftVersionDialog({ row, onOpenChange, pending, onSubmit }: { row: AppVersion | null; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: AppVersionDraftUpdateInput) => void }) {
  const form = useForm<AppVersionDraftUpdateInput>({ resolver: zodResolver(appVersionDraftUpdateSchema), defaultValues: { version: '', release_notes: '' } })
  React.useEffect(() => { if (row) form.reset({ version: row.version, release_notes: row.release_notes ?? '' }) }, [row, form])
  return <Dialog open={Boolean(row)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>编辑版本草稿</DialogTitle><DialogDescription>仅展示版本名与更新日志可编辑，平台与构建号不可修改。</DialogDescription></DialogHeader><form id="app-version-draft" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="客户端平台" htmlFor="av-draft-platform"><Input id="av-draft-platform" value={row?.client_platform ?? ''} disabled /></FormField><FormField label="构建号 (Build Number)" htmlFor="av-draft-build"><Input id="av-draft-build" value={row?.build_number ?? ''} disabled /></FormField><FormField label="版本展示名" htmlFor="av-draft-version" error={form.formState.errors.version?.message}><Input id="av-draft-version" {...form.register('version')} /></FormField><FormField label="更新日志" htmlFor="av-draft-notes"><Textarea id="av-draft-notes" {...form.register('release_notes')} /></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="app-version-draft" loading={pending}>保存草稿</Button></DialogFooter></DialogContent></Dialog>
}

function PolicyDialog({ row, onOpenChange, pending, onSubmit }: { row: AppVersion | null; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: AppVersionPolicyInput) => void }) {
  const form = useForm<AppVersionPolicyInput>({ resolver: zodResolver(appVersionPolicySchema), defaultValues: { status: 'active', update_policy: 'none', expected_updated_at: '' } })
  React.useEffect(() => { if (row && row.status !== 'draft') form.reset({ status: row.status, update_policy: row.update_policy, expected_updated_at: row.updated_at }) }, [row, form])
  return <Dialog open={Boolean(row)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>修改版本更新策略</DialogTitle><DialogDescription>后端将严格校验状态与更新策略的一致性约束，并发版本号用于防范冲突。</DialogDescription></DialogHeader><form id="app-version-policy" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="状态" htmlFor="av-status"><NativeSelect id="av-status" {...form.register('status')}><option value="active">active (启用)</option><option value="deprecated">deprecated (废弃)</option><option value="blocked">blocked (阻断)</option></NativeSelect></FormField><FormField label="更新策略" htmlFor="av-policy"><NativeSelect id="av-policy" {...form.register('update_policy')}><option value="none">none (无提示)</option><option value="optional">optional (建议升级)</option><option value="required">required (强制升级)</option></NativeSelect></FormField><FormField label="期望版本更新时间" htmlFor="av-expected"><Input id="av-expected" value={form.watch('expected_updated_at')} disabled /></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form="app-version-policy" loading={pending}>保存策略</Button></DialogFooter></DialogContent></Dialog>
}
