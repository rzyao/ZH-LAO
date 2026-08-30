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
    { accessorKey: 'key', header: 'Registered key', cell: ({ row }) => <code className="text-xs">{row.original.key}</code> },
    { accessorKey: 'value_type', header: 'Type' },
    { id: 'visibility', header: 'Visibility', cell: ({ row }) => definitions.get(row.original.key as never)?.visibility ?? 'unregistered' },
    { accessorKey: 'value', header: 'Current value', cell: ({ row }) => <span className="block max-w-80 truncate font-mono text-xs">{typeof row.original.value === 'string' ? row.original.value : JSON.stringify(row.original.value)}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)} label={row.original.status} /> },
    { accessorKey: 'updated_at', header: 'Updated', cell: ({ row }) => formatDateTime(row.original.updated_at) },
    {
      id: 'actions', header: 'Actions', cell: ({ row }) => {
        const config = row.original
        const registered = definitions.has(config.key as never)
        const retired = config.status === 'retired'
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={!canWrite || !registered || retired} onClick={() => setEditing(config)}>Edit</Button>
            <Button size="sm" variant="destructive" disabled={!canWrite || !registered || retired} onClick={() => setRetiring(config)}>Retire</Button>
          </div>
        )
      },
    },
  ], [canWrite, definitions])

  const onError = async (error: unknown) => {
    if (isConflictError(error)) {
      await query.refetch()
      toast.warning({
        title: 'Stale configuration data',
        description: 'Latest data was fetched. Review the current value and updated timestamp, then confirm your change again. Nothing was overwritten.',
      })
      return
    }
    toast.error({ title: 'Runtime Config operation failed', description: mutationErrorMessage(error) })
  }

  return (
    <ListPageLayout
      title="Runtime Configs"
      description="Only frozen code-registry keys are editable. This is not an arbitrary key/JSON configuration editor."
      breadcrumb={[{ label: 'System' }, { label: 'Platform', href: '/platform' }, { label: 'Runtime Configs' }]}
    >
      <div className="p-4">
        <PermissionContract read={PLATFORM_PERMISSIONS.runtimeConfigsRead} write={PLATFORM_PERMISSIONS.runtimeConfigsWrite} />
        <div className="mb-3 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          Registered V1 keys: {RUNTIME_CONFIG_REGISTRY.map((entry) => `${entry.key} (${entry.valueType}, ${entry.visibility})`).join(' · ')}
        </div>
        <DataTable columns={columns} data={query.data ?? []} loading={query.isLoading} error={query.error} onRetry={() => query.refetch()} getRowId={(row) => row.key} emptyTitle="No runtime config rows" emptyDescription="Rows may be absent while registered definitions use their frozen fallback semantics." />
      </div>

      <RuntimeConfigDialog
        config={editing}
        pending={setMutation.isPending}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(input) => setMutation.mutate(input, {
          onSuccess: () => { setEditing(null); toast.success({ title: 'Runtime config updated' }) },
          onError,
        })}
      />
      <ConfirmDialog
        open={Boolean(retiring)}
        onOpenChange={(open) => !open && setRetiring(null)}
        title="Retire runtime config?"
        description="Retirement is terminal. Runtime consumers will use the registered fallback or CONFIG_UNAVAILABLE semantics."
        destructive
        confirmLabel="Retire"
        loading={retireMutation.isPending}
        onConfirm={() => retiring && retireMutation.mutate(retiring.key, {
          onSuccess: () => { setRetiring(null); toast.success({ title: 'Runtime config retired' }) },
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
        <DialogHeader><DialogTitle>Edit runtime config</DialogTitle><DialogDescription>Key and value_type are immutable. expected_updated_at protects against stale writes.</DialogDescription></DialogHeader>
        <form id="runtime-config-form" className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Key" htmlFor="rc-key"><Input id="rc-key" value={definition?.key ?? ''} disabled /></FormField>
          <FormField label="Value type" htmlFor="rc-type"><Input id="rc-type" value={definition?.valueType ?? ''} disabled /></FormField>
          <FormField label="Value" htmlFor="rc-value" error={form.formState.errors.value?.message}><Input id="rc-value" {...form.register('value')} /></FormField>
          <FormField label="Description" htmlFor="rc-description"><Textarea id="rc-description" {...form.register('description')} /></FormField>
          <FormField label="Expected updated at" htmlFor="rc-updated" hint="Read-only concurrency token sent back with the mutation."><Input id="rc-updated" value={form.watch('expected_updated_at') ?? ''} disabled /></FormField>
        </form>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="runtime-config-form" loading={pending}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
