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
  const fail = (error: unknown) => toast.error({ title: 'Announcement operation failed', description: mutationErrorMessage(error) })

  const columns = React.useMemo<ColumnDef<Announcement>[]>(() => [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'region_code', header: 'Region', cell: ({ row }) => row.original.region_code ?? 'All' },
    { accessorKey: 'client_platform', header: 'Client', cell: ({ row }) => row.original.client_platform ?? 'All' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    { accessorKey: 'starts_at', header: 'Starts', cell: ({ row }) => formatDateTime(row.original.starts_at) },
    { accessorKey: 'ends_at', header: 'Ends', cell: ({ row }) => formatDateTime(row.original.ends_at) },
    { id: 'actions', header: 'Actions', cell: ({ row }) => <div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" disabled={!canWrite || row.original.status === 'retired'} onClick={() => setEditing(row.original)}>Edit</Button><Button size="sm" variant="outline" disabled={!canWrite || row.original.status !== 'draft'} onClick={() => setPublishRow(row.original)}>Publish</Button><Button size="sm" variant="outline" disabled={!canWrite || row.original.status !== 'published'} onClick={() => setRetireRow(row.original)}>Retire</Button><Button size="sm" variant="destructive" disabled={!canWrite || row.original.status !== 'draft'} onClick={() => setDeleteRow(row.original)}>Delete draft</Button></div> },
  ], [canWrite])

  return <ListPageLayout title="Announcements" description="Draft/publish/retire lifecycle using only frozen title, content, scope and time fields." breadcrumb={[{ label: 'System' }, { label: 'Platform', href: '/platform' }, { label: 'Announcements' }]} actions={<Button disabled={!canWrite} onClick={() => setCreateOpen(true)}>Create draft</Button>}>
    <div className="p-4"><PermissionContract read={PLATFORM_PERMISSIONS.announcementsRead} write={PLATFORM_PERMISSIONS.announcementsWrite} /><DataTable columns={columns} data={query.data ?? []} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => row.announcement_id} emptyTitle="No announcements" /></div>
    <AnnouncementDialog open={createOpen} row={null} onOpenChange={setCreateOpen} pending={createMutation.isPending} onSubmit={(input) => createMutation.mutate(input, { onSuccess: () => { setCreateOpen(false); toast.success({ title: 'Announcement draft created' }) }, onError: fail })} />
    <AnnouncementDialog open={Boolean(editing)} row={editing} onOpenChange={(open) => !open && setEditing(null)} pending={updateMutation.isPending} onSubmit={(input) => editing && updateMutation.mutate({ id: editing.announcement_id, input }, { onSuccess: () => { setEditing(null); toast.success({ title: 'Announcement updated' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(publishRow)} onOpenChange={(open) => !open && setPublishRow(null)} title="Publish announcement?" description="Publishing makes the announcement eligible for runtime delivery when its time/scope matches." confirmLabel="Publish" loading={publishMutation.isPending} onConfirm={() => publishRow && publishMutation.mutate(publishRow.announcement_id, { onSuccess: () => { setPublishRow(null); toast.success({ title: 'Announcement published' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(retireRow)} onOpenChange={(open) => !open && setRetireRow(null)} title="Retire announcement?" description="Retired announcements remain historical and are no longer served to clients." confirmLabel="Retire" loading={retireMutation.isPending} onConfirm={() => retireRow && retireMutation.mutate(retireRow.announcement_id, { onSuccess: () => { setRetireRow(null); toast.success({ title: 'Announcement retired' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(deleteRow)} onOpenChange={(open) => !open && setDeleteRow(null)} title="Delete draft announcement?" description="Only drafts may be deleted. Published history is retained." confirmLabel="Delete draft" destructive loading={deleteMutation.isPending} onConfirm={() => deleteRow && deleteMutation.mutate(deleteRow.announcement_id, { onSuccess: () => { setDeleteRow(null); toast.success({ title: 'Draft deleted' }) }, onError: fail })} />
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
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{row ? 'Edit announcement' : 'Create announcement draft'}</DialogTitle><DialogDescription>{published ? 'After publish, scope and initial start are immutable; only title/content/end time are editable.' : 'No locale, priority, push, email, SMS or chat-broadcast semantics are added.'}</DialogDescription></DialogHeader><form id={row ? 'announcement-edit' : 'announcement-create'} className="space-y-3" onSubmit={form.handleSubmit((value) => onSubmit({ ...value, starts_at: toIso(value.starts_at ?? ''), ends_at: toIso(value.ends_at ?? '') }))}><FormField label="Title" htmlFor="ann-title" error={form.formState.errors.title?.message}><Input id="ann-title" {...form.register('title')} /></FormField><FormField label="Content" htmlFor="ann-content" error={form.formState.errors.content?.message}><Textarea id="ann-content" rows={5} {...form.register('content')} /></FormField><div className="grid gap-3 sm:grid-cols-2"><FormField label="Region code" htmlFor="ann-region"><Input id="ann-region" disabled={published} placeholder="LA or blank" {...form.register('region_code')} /></FormField><FormField label="Client platform" htmlFor="ann-client"><NativeSelect id="ann-client" disabled={published} {...form.register('client_platform')}><option value="">All</option><option value="android">android</option><option value="ios">ios</option></NativeSelect></FormField><FormField label="Starts at" htmlFor="ann-start"><Input id="ann-start" type="datetime-local" disabled={published} {...form.register('starts_at')} /></FormField><FormField label="Ends at" htmlFor="ann-end" error={form.formState.errors.ends_at?.message}><Input id="ann-end" type="datetime-local" {...form.register('ends_at')} /></FormField></div></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form={row ? 'announcement-edit' : 'announcement-create'} loading={pending}>Save</Button></DialogFooter></DialogContent></Dialog>
}
