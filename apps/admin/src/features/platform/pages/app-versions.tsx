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
  const fail = (error: unknown) => toast.error({ title: 'App Version operation failed', description: mutationErrorMessage(error) })

  const columns = React.useMemo<ColumnDef<AppVersion>[]>(() => [
    { accessorKey: 'client_platform', header: 'Platform' },
    { accessorKey: 'version', header: 'Version label' },
    { accessorKey: 'build_number', header: 'Build number' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    { accessorKey: 'update_policy', header: 'Update policy' },
    { accessorKey: 'released_at', header: 'Released', cell: ({ row }) => formatDateTime(row.original.released_at) },
    { accessorKey: 'release_notes', header: 'Release notes', cell: ({ row }) => <span className="block max-w-64 truncate">{row.original.release_notes ?? '—'}</span> },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="outline" disabled={!canWrite || row.original.status !== 'draft'} onClick={() => setDraftRow(row.original)}>Edit draft</Button>
          <Button size="sm" variant="outline" disabled={!canWrite || row.original.status !== 'draft'} onClick={() => setPublishRow(row.original)}>Publish</Button>
          <Button size="sm" variant="outline" disabled={!canWrite || row.original.status === 'draft'} onClick={() => setPolicyRow(row.original)}>Policy</Button>
          <Button size="sm" variant="destructive" disabled={!canWrite || row.original.status !== 'draft' || row.original.released_at !== null} onClick={() => setDeleteRow(row.original)}>Delete draft</Button>
        </div>
      ),
    },
  ], [canWrite])

  return <ListPageLayout title="App Versions" description="Ordering and policy use numeric build_number; version strings are labels, not ordering semantics." breadcrumb={[{ label: 'System' }, { label: 'Platform', href: '/platform' }, { label: 'App Versions' }]} actions={<Button disabled={!canWrite} onClick={() => setCreateOpen(true)}>Create draft</Button>}>
    <div className="p-4">
      <PermissionContract read={PLATFORM_PERMISSIONS.appVersionsRead} write={PLATFORM_PERMISSIONS.appVersionsWrite} />
      <div className="mb-3 max-w-48"><NativeSelect aria-label="Filter client platform" value={platform ?? ''} onChange={(event) => setPlatform((event.target.value || undefined) as ClientPlatform | undefined)}><option value="">All platforms</option><option value="android">android</option><option value="ios">ios</option></NativeSelect></div>
      <DataTable columns={columns} data={query.data ?? []} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => `${row.client_platform}:${row.build_number}`} emptyTitle="No app versions" />
    </div>
    <CreateVersionDialog open={createOpen} onOpenChange={setCreateOpen} pending={createMutation.isPending} onSubmit={(input) => createMutation.mutate(input, { onSuccess: () => { setCreateOpen(false); toast.success({ title: 'Draft created' }) }, onError: fail })} />
    <DraftVersionDialog row={draftRow} onOpenChange={(open) => !open && setDraftRow(null)} pending={draftMutation.isPending} onSubmit={(input) => draftRow && draftMutation.mutate({ platform: draftRow.client_platform, buildNumber: draftRow.build_number, input }, { onSuccess: () => { setDraftRow(null); toast.success({ title: 'Draft updated' }) }, onError: fail })} />
    <PolicyDialog row={policyRow} onOpenChange={(open) => !open && setPolicyRow(null)} pending={policyMutation.isPending} onSubmit={(input) => policyRow && policyMutation.mutate({ platform: policyRow.client_platform, buildNumber: policyRow.build_number, input }, { onSuccess: () => { setPolicyRow(null); toast.success({ title: 'Policy updated' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(publishRow)} onOpenChange={(open) => !open && setPublishRow(null)} title="Publish app version?" description="Publishing releases this numeric build immediately; scheduled publish is not supported." confirmLabel="Publish" loading={publishMutation.isPending} onConfirm={() => publishRow && publishMutation.mutate({ platform: publishRow.client_platform, buildNumber: publishRow.build_number }, { onSuccess: () => { setPublishRow(null); toast.success({ title: 'Version published' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(deleteRow)} onOpenChange={(open) => !open && setDeleteRow(null)} title="Delete draft?" description="Only a never-released draft can be deleted." confirmLabel="Delete draft" destructive loading={deleteMutation.isPending} onConfirm={() => deleteRow && deleteMutation.mutate({ platform: deleteRow.client_platform, buildNumber: deleteRow.build_number }, { onSuccess: () => { setDeleteRow(null); toast.success({ title: 'Draft deleted' }) }, onError: fail })} />
  </ListPageLayout>
}

function CreateVersionDialog({ open, onOpenChange, pending, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: AppVersionCreateInput) => void }) {
  const form = useForm<AppVersionCreateInput>({ resolver: zodResolver(appVersionCreateSchema), defaultValues: { client_platform: 'android', version: '', build_number: 1, release_notes: '' } })
  React.useEffect(() => { if (!open) form.reset({ client_platform: 'android', version: '', build_number: 1, release_notes: '' }) }, [open, form])
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Create app version draft</DialogTitle><DialogDescription>No release channel, region rollout, store URL or scheduled publish fields exist in the frozen contract.</DialogDescription></DialogHeader><form id="app-version-create" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="Client platform" htmlFor="av-platform"><NativeSelect id="av-platform" {...form.register('client_platform')}><option value="android">android</option><option value="ios">ios</option></NativeSelect></FormField><FormField label="Version label" htmlFor="av-version" error={form.formState.errors.version?.message}><Input id="av-version" {...form.register('version')} /></FormField><FormField label="Build number" htmlFor="av-build" error={form.formState.errors.build_number?.message}><Input id="av-build" type="number" {...form.register('build_number', { valueAsNumber: true })} /></FormField><FormField label="Release notes" htmlFor="av-notes"><Textarea id="av-notes" {...form.register('release_notes')} /></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="app-version-create" loading={pending}>Create</Button></DialogFooter></DialogContent></Dialog>
}

function DraftVersionDialog({ row, onOpenChange, pending, onSubmit }: { row: AppVersion | null; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: AppVersionDraftUpdateInput) => void }) {
  const form = useForm<AppVersionDraftUpdateInput>({ resolver: zodResolver(appVersionDraftUpdateSchema), defaultValues: { version: '', release_notes: '' } })
  React.useEffect(() => { if (row) form.reset({ version: row.version, release_notes: row.release_notes ?? '' }) }, [row, form])
  return <Dialog open={Boolean(row)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Edit app version draft</DialogTitle><DialogDescription>Only the version label and release notes are mutable. Client platform and numeric build number remain immutable.</DialogDescription></DialogHeader><form id="app-version-draft" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="Client platform" htmlFor="av-draft-platform"><Input id="av-draft-platform" value={row?.client_platform ?? ''} disabled /></FormField><FormField label="Build number" htmlFor="av-draft-build"><Input id="av-draft-build" value={row?.build_number ?? ''} disabled /></FormField><FormField label="Version label" htmlFor="av-draft-version" error={form.formState.errors.version?.message}><Input id="av-draft-version" {...form.register('version')} /></FormField><FormField label="Release notes" htmlFor="av-draft-notes"><Textarea id="av-draft-notes" {...form.register('release_notes')} /></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="app-version-draft" loading={pending}>Save draft</Button></DialogFooter></DialogContent></Dialog>
}

function PolicyDialog({ row, onOpenChange, pending, onSubmit }: { row: AppVersion | null; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: AppVersionPolicyInput) => void }) {
  const form = useForm<AppVersionPolicyInput>({ resolver: zodResolver(appVersionPolicySchema), defaultValues: { status: 'active', update_policy: 'none', expected_updated_at: '' } })
  React.useEffect(() => { if (row && row.status !== 'draft') form.reset({ status: row.status, update_policy: row.update_policy, expected_updated_at: row.updated_at }) }, [row, form])
  return <Dialog open={Boolean(row)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Change app version policy</DialogTitle><DialogDescription>Backend validates status/update-policy invariants and uses expected_updated_at for conflict protection.</DialogDescription></DialogHeader><form id="app-version-policy" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="Status" htmlFor="av-status"><NativeSelect id="av-status" {...form.register('status')}><option value="active">active</option><option value="deprecated">deprecated</option><option value="blocked">blocked</option></NativeSelect></FormField><FormField label="Update policy" htmlFor="av-policy"><NativeSelect id="av-policy" {...form.register('update_policy')}><option value="none">none</option><option value="optional">optional</option><option value="required">required</option></NativeSelect></FormField><FormField label="Expected updated at" htmlFor="av-expected"><Input id="av-expected" value={form.watch('expected_updated_at')} disabled /></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="app-version-policy" loading={pending}>Save policy</Button></DialogFooter></DialogContent></Dialog>
}
