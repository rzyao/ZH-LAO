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
    { accessorKey: 'key', header: 'Key', cell: ({ row }) => <code className="text-xs">{row.original.key}</code> },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'default_enabled', header: 'Default', cell: ({ row }) => row.original.default_enabled ? 'Enabled' : 'Disabled' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    {
      id: 'overrides', header: 'Overrides', cell: ({ row }) => {
        const overrides = row.original.overrides
        if (!overrides) return <span className="text-xs text-muted-foreground">Inventory unavailable</span>
        return <span>{overrides.length}</span>
      },
    },
    {
      id: 'actions', header: 'Actions', enableSorting: false, cell: ({ row }) => {
        const flag = row.original
        const retired = flag.status === 'retired'
        return (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" disabled={!canWrite || retired} onClick={() => setEditing(flag)}>Edit</Button>
            <Button size="sm" variant="outline" disabled={!canWrite || retired} onClick={() => setOverrideFlag(flag)}>Override</Button>
            <Button size="sm" variant="destructive" disabled={!canWrite || retired} onClick={() => setRetiring(flag)}>Retire</Button>
          </div>
        )
      },
    },
  ], [canWrite])

  const fail = (error: unknown) => toast.error({ title: 'Feature Flag operation failed', description: mutationErrorMessage(error) })

  return (
    <ListPageLayout
      title="Feature Flags"
      description="Default state and scoped region/client overrides are separate. Keys are immutable and retired flags are terminal."
      breadcrumb={[{ label: 'System' }, { label: 'Platform', href: '/platform' }, { label: 'Feature Flags' }]}
      actions={<Button disabled={!canWrite} onClick={() => setCreateOpen(true)}>Create flag</Button>}
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
          emptyTitle="No feature flags"
          emptyDescription="Create the first registered product flag when you have write permission."
        />
        <p className="mt-3 text-xs text-muted-foreground">
          The current management list response may omit override inventory. Set/remove commands remain scoped to region_code and/or client_platform; global overrides are not supported.
        </p>
      </div>

      <CreateFlagDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        pending={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate(input, {
          onSuccess: () => { setCreateOpen(false); toast.success({ title: 'Feature flag created' }) },
          onError: fail,
        })}
      />
      <EditFlagDialog
        flag={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        pending={updateMutation.isPending}
        onSubmit={(input) => editing && updateMutation.mutate({ key: editing.key, input }, {
          onSuccess: () => { setEditing(null); toast.success({ title: 'Feature flag updated' }) },
          onError: fail,
        })}
      />
      <OverrideDialog
        flag={overrideFlag}
        onOpenChange={(open) => !open && setOverrideFlag(null)}
        pending={setOverrideMutation.isPending || removeOverrideMutation.isPending}
        onSet={(input) => overrideFlag && setOverrideMutation.mutate({ key: overrideFlag.key, input }, {
          onSuccess: () => { setOverrideFlag(null); toast.success({ title: 'Override saved' }) },
          onError: fail,
        })}
        onRemove={(input) => overrideFlag && removeOverrideMutation.mutate({ key: overrideFlag.key, input }, {
          onSuccess: () => { setOverrideFlag(null); toast.success({ title: 'Override removed' }) },
          onError: fail,
        })}
      />
      <ConfirmDialog
        open={Boolean(retiring)}
        onOpenChange={(open) => !open && setRetiring(null)}
        title="Retire feature flag?"
        description="Retirement is terminal. The key remains historical and cannot be reactivated."
        confirmLabel="Retire"
        destructive
        loading={retireMutation.isPending}
        onConfirm={() => retiring && retireMutation.mutate(retiring.key, {
          onSuccess: () => { setRetiring(null); toast.success({ title: 'Feature flag retired' }) },
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
        <DialogHeader><DialogTitle>Create feature flag</DialogTitle><DialogDescription>Initial status is active. Key cannot be changed later.</DialogDescription></DialogHeader>
        <form id="create-feature-flag" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Key" htmlFor="ff-key" error={form.formState.errors.key?.message}><Input id="ff-key" {...form.register('key')} /></FormField>
          <FormField label="Name" htmlFor="ff-name" error={form.formState.errors.name?.message}><Input id="ff-name" {...form.register('name')} /></FormField>
          <FormField label="Description" htmlFor="ff-description" error={form.formState.errors.description?.message}><Textarea id="ff-description" {...form.register('description')} /></FormField>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('default_enabled')} /> Default enabled</label>
        </form>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="create-feature-flag" loading={pending}>Create</Button></DialogFooter>
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
        <DialogHeader><DialogTitle>Edit feature flag</DialogTitle><DialogDescription>Key is immutable. Active/inactive is reversible; retirement uses the explicit command.</DialogDescription></DialogHeader>
        <form id="edit-feature-flag" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Key" htmlFor="ff-edit-key"><Input id="ff-edit-key" value={flag?.key ?? ''} disabled /></FormField>
          <FormField label="Name" htmlFor="ff-edit-name" error={form.formState.errors.name?.message}><Input id="ff-edit-name" {...form.register('name')} /></FormField>
          <FormField label="Description" htmlFor="ff-edit-description"><Textarea id="ff-edit-description" {...form.register('description')} /></FormField>
          <FormField label="Status" htmlFor="ff-edit-status"><NativeSelect id="ff-edit-status" {...form.register('status')}><option value="active">active</option><option value="inactive">inactive</option></NativeSelect></FormField>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('default_enabled')} /> Default enabled</label>
        </form>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="edit-feature-flag" loading={pending}>Save</Button></DialogFooter>
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
        <DialogHeader><DialogTitle>Scoped override</DialogTitle><DialogDescription>At least one scope is required. A global override is intentionally unsupported.</DialogDescription></DialogHeader>
        <form id="feature-override" className="space-y-3" onSubmit={form.handleSubmit(onSet)}>
          <FormField label="Region code" htmlFor="ff-region" error={form.formState.errors.region_code?.message}><Input id="ff-region" placeholder="LA" {...form.register('region_code')} /></FormField>
          <FormField label="Client platform" htmlFor="ff-client"><NativeSelect id="ff-client" {...form.register('client_platform')}><option value="">Any client</option><option value="android">android</option><option value="ios">ios</option></NativeSelect></FormField>
          {form.formState.errors.root?.message ? <p className="text-xs text-destructive">{form.formState.errors.root.message}</p> : null}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('enabled')} /> Enabled for this scope</label>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={pending || (!values.region_code && !values.client_platform)} onClick={() => onRemove({ region_code: values.region_code, client_platform: values.client_platform })}>Remove scope</Button>
          <Button type="submit" form="feature-override" loading={pending}>Set override</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
