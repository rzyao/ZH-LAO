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
import { PLATFORM_PERMISSIONS, announcementCreateSchema, statusTone, type Announcement, type AnnouncementCreateInput } from '../contracts'
import { useAnnouncementsQuery, useCreateAnnouncement, useDeleteAnnouncementDraft, usePublishAnnouncement, useRetireAnnouncement, useUpdateAnnouncement } from '../queries'
import { FormField, NativeSelect, PermissionContract, formatDateTime, mutationErrorMessage, useExactPermission } from '../components'

export function AnnouncementsPage() {
  const query = useAnnouncementsQuery()
  const canWrite = useExactPermission(PLATFORM_PERMISSIONS.announcementsWrite)
  const toast = useToastApi()
  const createMutation = useCreateAnnouncement()
  const updateMutation = useUpdateAnnouncement()
  const publishMutation = usePublishAnnouncement()
  const retireMutation = useRetireAnnouncement()
  const deleteMutation = useDeleteAnnouncementDraft()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Announcement | null>(null)
  const [publishRow, setPublishRow] = React.useState<Announcement | null>(null)
  const [retireRow, setRetireRow] = React.useState<Announcement | null>(null)
  const [deleteRow, setDeleteRow] = React.useState<Announcement | null>(null)
  const fail = (error: unknown) => toast.error({ title: '系统公告操作失败', description: mutationErrorMessage(error) })

  const columns = React.useMemo<ColumnDef<Announcement>[]>(() => [
    { accessorKey: 'title', header: '公告标题' },
    { accessorKey: 'region_code', header: '投放地区', cell: ({ row }) => row.original.region_code ?? '全部地区' },
    { accessorKey: 'client_platform', header: '客户端平台', cell: ({ row }) => row.original.client_platform ?? '全部平台' },
    { accessorKey: 'status', header: '状态', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    { accessorKey: 'starts_at', header: '生效开始时间', cell: ({ row }) => formatDateTime(row.original.starts_at) },
    { accessorKey: 'ends_at', header: '生效结束时间', cell: ({ row }) => formatDateTime(row.original.ends_at) },
    { id: 'actions', header: '操作', cell: ({ row }) => <div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" disabled={!canWrite || row.original.status === 'retired'} onClick={() => setEditing(row.original)}>编辑</Button><Button size="sm" variant="outline" disabled={!canWrite || row.original.status !== 'draft'} onClick={() => setPublishRow(row.original)}>发布</Button><Button size="sm" variant="outline" disabled={!canWrite || row.original.status !== 'published'} onClick={() => setRetireRow(row.original)}>下线</Button><Button size="sm" variant="destructive" disabled={!canWrite || row.original.status !== 'draft'} onClick={() => setDeleteRow(row.original)}>删除草稿</Button></div> },
  ], [canWrite])

  return <ListPageLayout title="全服与定向公告" description="支持按地区、客户端平台以及有效时间窗口进行系统公告的草稿编排、发布与下线。" breadcrumb={[{ label: '系统运维' }, { label: '平台控制台', href: '/platform' }, { label: '系统公告' }]} actions={<Button disabled={!canWrite} onClick={() => setCreateOpen(true)}>新建公告草稿</Button>}>
    <div className="p-4"><PermissionContract read={PLATFORM_PERMISSIONS.announcementsRead} write={PLATFORM_PERMISSIONS.announcementsWrite} /><DataTable columns={columns} data={query.data ?? []} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => row.announcement_id} emptyTitle="暂无公告记录" /></div>
    <AnnouncementDialog open={createOpen} row={null} onOpenChange={setCreateOpen} pending={createMutation.isPending} onSubmit={(input) => createMutation.mutate(input, { onSuccess: () => { setCreateOpen(false); toast.success({ title: '公告草稿已创建' }) }, onError: fail })} />
    <AnnouncementDialog open={Boolean(editing)} row={editing} onOpenChange={(open) => !open && setEditing(null)} pending={updateMutation.isPending} onSubmit={(input) => editing && updateMutation.mutate({ id: editing.announcement_id, input }, { onSuccess: () => { setEditing(null); toast.success({ title: '公告已更新' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(publishRow)} onOpenChange={(open) => !open && setPublishRow(null)} title="确认发布此公告？" description="发布后，在指定生效时间窗口与目标范围内的客户端将可接收该公告。" confirmLabel="确认发布" loading={publishMutation.isPending} onConfirm={() => publishRow && publishMutation.mutate(publishRow.announcement_id, { onSuccess: () => { setPublishRow(null); toast.success({ title: '公告已正式发布' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(retireRow)} onOpenChange={(open) => !open && setRetireRow(null)} title="确认下线此公告？" description="已下线的公告作为历史数据归档保留，客户端将不再展示。" confirmLabel="确认下线" loading={retireMutation.isPending} onConfirm={() => retireRow && retireMutation.mutate(retireRow.announcement_id, { onSuccess: () => { setRetireRow(null); toast.success({ title: '公告已成功下线' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(deleteRow)} onOpenChange={(open) => !open && setDeleteRow(null)} title="确认删除公告草稿？" description="仅允许删除草稿。已发布的历史记录将被归档保留。" confirmLabel="删除草稿" destructive loading={deleteMutation.isPending} onConfirm={() => deleteRow && deleteMutation.mutate(deleteRow.announcement_id, { onSuccess: () => { setDeleteRow(null); toast.success({ title: '草稿已删除' }) }, onError: fail })} />
  </ListPageLayout>
}

function toLocalInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
function toIso(value: string): string { return value ? new Date(value).toISOString() : '' }

function AnnouncementDialog({ open, row, onOpenChange, pending, onSubmit }: { open: boolean; row: Announcement | null; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: AnnouncementCreateInput) => void }) {
  const form = useForm<AnnouncementCreateInput>({ resolver: zodResolver(announcementCreateSchema), defaultValues: { title: '', content: '', region_code: '', client_platform: '', starts_at: '', ends_at: '' } })
  React.useEffect(() => { if (row) form.reset({ title: row.title, content: row.content, region_code: row.region_code ?? '', client_platform: row.client_platform ?? '', starts_at: toLocalInput(row.starts_at), ends_at: toLocalInput(row.ends_at) }); else if (open) form.reset({ title: '', content: '', region_code: '', client_platform: '', starts_at: '', ends_at: '' }) }, [row, open, form])
  const published = row?.status === 'published'
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{row ? '编辑公告' : '新建公告草稿'}</DialogTitle><DialogDescription>{published ? '公告发布后，投放范围与初始生效时间锁定不可修改；仅标题、正文及结束时间可调整。' : '填写公告标题、内容、投放地区及起止时间。'}</DialogDescription></DialogHeader><form id={row ? 'announcement-edit' : 'announcement-create'} className="space-y-3" onSubmit={form.handleSubmit((value) => onSubmit({ ...value, starts_at: toIso(value.starts_at ?? ''), ends_at: toIso(value.ends_at ?? '') }))}><FormField label="公告标题" htmlFor="ann-title" error={form.formState.errors.title?.message}><Input id="ann-title" {...form.register('title')} placeholder="请输入公告标题" /></FormField><FormField label="公告内容" htmlFor="ann-content" error={form.formState.errors.content?.message}><Textarea id="ann-content" rows={5} {...form.register('content')} placeholder="支持多行文本内容" /></FormField><div className="grid gap-3 sm:grid-cols-2"><FormField label="投放地区 (Region Code)" htmlFor="ann-region"><Input id="ann-region" disabled={published} placeholder="例：LA 或留空表示全地区" {...form.register('region_code')} /></FormField><FormField label="客户端平台" htmlFor="ann-client"><NativeSelect id="ann-client" disabled={published} {...form.register('client_platform')}><option value="">全部平台</option><option value="android">Android</option><option value="ios">iOS</option></NativeSelect></FormField><FormField label="生效开始时间" htmlFor="ann-start"><Input id="ann-start" type="datetime-local" disabled={published} {...form.register('starts_at')} /></FormField><FormField label="生效结束时间" htmlFor="ann-end" error={form.formState.errors.ends_at?.message}><Input id="ann-end" type="datetime-local" {...form.register('ends_at')} /></FormField></div></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" form={row ? 'announcement-edit' : 'announcement-create'} loading={pending}>保存</Button></DialogFooter></DialogContent></Dialog>
}
