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
  const fail = (error: unknown) => toast.error({ title: 'Region operation failed', description: mutationErrorMessage(error) })

  const columns = React.useMemo<ColumnDef<Region>[]>(() => [
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <code className="text-xs">{row.original.code}</code> },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'default_locale', header: 'Default locale' },
    { accessorKey: 'timezone', header: 'Timezone' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    { id: 'actions', header: 'Actions', cell: ({ row }) => <div className="flex gap-1"><Button size="sm" variant="outline" disabled={!canWrite || row.original.status === 'retired'} onClick={() => setEditing(row.original)}>Edit</Button><Button size="sm" variant="destructive" disabled={!canWrite || row.original.status === 'retired'} onClick={() => setRetiring(row.original)}>Retire</Button></div> },
  ], [canWrite])

  return <ListPageLayout title="Regions" description="Platform product regions only. Region code is immutable and retired is terminal." breadcrumb={[{ label: 'System' }, { label: 'Platform', href: '/platform' }, { label: 'Regions' }]} actions={<Button disabled={!canWrite} onClick={() => setCreateOpen(true)}>Create region</Button>}>
    <div className="p-4"><PermissionContract read={PLATFORM_PERMISSIONS.regionsRead} write={PLATFORM_PERMISSIONS.regionsWrite} /><DataTable columns={columns} data={query.data ?? []} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => row.code} emptyTitle="No regions" /></div>
    <CreateRegionDialog open={createOpen} onOpenChange={setCreateOpen} pending={createMutation.isPending} onSubmit={(input) => createMutation.mutate(input, { onSuccess: () => { setCreateOpen(false); toast.success({ title: 'Region created' }) }, onError: fail })} />
    <EditRegionDialog row={editing} onOpenChange={(open) => !open && setEditing(null)} pending={updateMutation.isPending} onSubmit={(input) => editing && updateMutation.mutate({ code: editing.code, input }, { onSuccess: () => { setEditing(null); toast.success({ title: 'Region updated' }) }, onError: fail })} />
    <ConfirmDialog open={Boolean(retiring)} onOpenChange={(open) => !open && setRetiring(null)} title="Retire region?" description="Retirement is terminal. The code remains historical and is not physically deleted." confirmLabel="Retire" destructive loading={retireMutation.isPending} onConfirm={() => retiring && retireMutation.mutate(retiring.code, { onSuccess: () => { setRetiring(null); toast.success({ title: 'Region retired' }) }, onError: fail })} />
  </ListPageLayout>
}

function CreateRegionDialog({ open, onOpenChange, pending, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: RegionCreateInput) => void }) {
  const form = useForm<RegionCreateInput>({ resolver: zodResolver(regionCreateSchema), defaultValues: { code: '', name: '', default_locale: '', timezone: '' } })
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Create region</DialogTitle><DialogDescription>Initial status is active. Identity profile/location concepts do not belong here.</DialogDescription></DialogHeader><form id="region-create" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="Code" htmlFor="region-code" error={form.formState.errors.code?.message}><Input id="region-code" placeholder="LA" {...form.register('code')} /></FormField><FormField label="Name" htmlFor="region-name"><Input id="region-name" {...form.register('name')} /></FormField><FormField label="Default locale" htmlFor="region-locale"><Input id="region-locale" placeholder="lo-LA" {...form.register('default_locale')} /></FormField><FormField label="Timezone" htmlFor="region-timezone"><Input id="region-timezone" placeholder="Asia/Vientiane" {...form.register('timezone')} /></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="region-create" loading={pending}>Create</Button></DialogFooter></DialogContent></Dialog>
}

function EditRegionDialog({ row, onOpenChange, pending, onSubmit }: { row: Region | null; onOpenChange: (open: boolean) => void; pending: boolean; onSubmit: (input: RegionUpdateInput) => void }) {
  const form = useForm<RegionUpdateInput>({ resolver: zodResolver(regionUpdateSchema), defaultValues: { name: '', default_locale: '', timezone: '', status: 'active' } })
  React.useEffect(() => { if (row) form.reset({ name: row.name, default_locale: row.default_locale, timezone: row.timezone, status: row.status === 'inactive' ? 'inactive' : 'active' }) }, [row, form])
  return <Dialog open={Boolean(row)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Edit region</DialogTitle><DialogDescription>Code is immutable. Active/inactive is reversible; retirement uses the explicit command.</DialogDescription></DialogHeader><form id="region-edit" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}><FormField label="Code" htmlFor="region-edit-code"><Input id="region-edit-code" value={row?.code ?? ''} disabled /></FormField><FormField label="Name" htmlFor="region-edit-name"><Input id="region-edit-name" {...form.register('name')} /></FormField><FormField label="Default locale" htmlFor="region-edit-locale"><Input id="region-edit-locale" {...form.register('default_locale')} /></FormField><FormField label="Timezone" htmlFor="region-edit-timezone"><Input id="region-edit-timezone" {...form.register('timezone')} /></FormField><FormField label="Status" htmlFor="region-edit-status"><NativeSelect id="region-edit-status" {...form.register('status')}><option value="active">active</option><option value="inactive">inactive</option></NativeSelect></FormField></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="region-edit" loading={pending}>Save</Button></DialogFooter></DialogContent></Dialog>
}
