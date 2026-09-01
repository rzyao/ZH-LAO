import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table/data-table'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusBadge } from '@/components/common/status-badge'
import {
  OPERATIONS_PERMISSIONS,
  type AuditLog,
  type AuditLogQueryInput,
} from '../contracts'
import { useAuditLogsQuery } from '../queries'
import {
  FormField,
  PermissionContract,
  formatDateTime,
} from '../components'

export function AuditLogsPage() {
  const [filters, setFilters] = React.useState<AuditLogQueryInput>({ limit: 50 })
  const [filterForm, setFilterForm] = React.useState({
    action_key: '',
    target_domain: '',
    operator_id: '',
  })

  const query = useAuditLogsQuery(filters)
  const [inspectingLog, setInspectingLog] = React.useState<AuditLog | null>(null)

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({
      limit: 50,
      action_key: filterForm.action_key.trim() || undefined,
      target_domain: filterForm.target_domain.trim() || undefined,
      operator_id: filterForm.operator_id.trim() || undefined,
    })
  }

  const handleResetFilter = () => {
    setFilterForm({ action_key: '', target_domain: '', operator_id: '' })
    setFilters({ limit: 50 })
  }

  const columns = React.useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: '时间',
        cell: ({ row }) => (
          <span className="text-xs font-mono">{formatDateTime(row.original.created_at)}</span>
        ),
      },
      {
        accessorKey: 'action_key',
        header: '动作 (Action Key)',
        cell: ({ row }) => <code className="text-xs font-semibold">{row.original.action_key}</code>,
      },
      {
        accessorKey: 'operator_id',
        header: '操作员 ID',
        cell: ({ row }) => (
          <code className="text-xs text-muted-foreground">{row.original.operator_id}</code>
        ),
      },
      {
        id: 'target',
        header: '目标对象',
        cell: ({ row }) => {
          const target = row.original.target
          if (!target) return <span className="text-xs text-muted-foreground">—</span>
          return (
            <div className="text-xs">
              <span className="font-medium capitalize">{target.domain}</span>
              {target.type ? <span className="text-muted-foreground"> / {target.type}</span> : null}
              {target.id ? (
                <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {target.id}
                </div>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: 'ip_address',
        header: 'IP 地址',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.ip_address || '—'}</span>
        ),
      },
      {
        id: 'actions',
        header: '详情',
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="ghost" onClick={() => setInspectingLog(row.original)}>
            <Eye className="mr-1 size-3.5" />
            查看载荷
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <ListPageLayout
      title="操作审计日志"
      description="不可变追加记录后台操作员成功执行的所有敏感管理与业务变更操作。"
      breadcrumb={[{ label: '系统运维' }, { label: '运营权限', href: '/operations' }, { label: '操作审计日志' }]}
      actions={
        <Button size="sm" variant="outline" onClick={() => query.refetch()}>
          <RefreshCw className="mr-1 size-3.5" />
          刷新日志
        </Button>
      }
    >
      <div className="p-4 space-y-4">
        <PermissionContract read={OPERATIONS_PERMISSIONS.auditLogsRead} />

        {/* Filter Bar */}
        <form
          onSubmit={handleApplyFilter}
          className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3 text-sm"
        >
          <FormField label="动作标识 (Action Key)" htmlFor="filter_action" className="w-48">
            <Input
              id="filter_action"
              placeholder="例如 operations.roles"
              value={filterForm.action_key}
              onChange={(e) => setFilterForm({ ...filterForm, action_key: e.target.value })}
            />
          </FormField>
          <FormField label="目标领域 (Target Domain)" htmlFor="filter_domain" className="w-36">
            <Input
              id="filter_domain"
              placeholder="例如 platform"
              value={filterForm.target_domain}
              onChange={(e) => setFilterForm({ ...filterForm, target_domain: e.target.value })}
            />
          </FormField>
          <FormField label="操作员 UUID" htmlFor="filter_operator" className="w-60">
            <Input
              id="filter_operator"
              placeholder="操作员 UUID..."
              value={filterForm.operator_id}
              onChange={(e) => setFilterForm({ ...filterForm, operator_id: e.target.value })}
            />
          </FormField>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              <Filter className="mr-1 size-3.5" />
              筛选
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleResetFilter}>
              重置
            </Button>
          </div>
        </form>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => query.refetch()}
          getRowId={(row) => row.audit_log_id}
          emptyTitle="暂无审计记录"
          emptyDescription="当管理员执行写操作时，系统会自动记录操作审计日志。"
        />
        <p className="text-xs text-muted-foreground">
          规范保证：审计日志具有 append-only 严格不可变性，系统仅记录已成功执行的事务。
        </p>
      </div>

      {/* Inspect Log Detail Modal */}
      {inspectingLog ? (
        <Dialog open={Boolean(inspectingLog)} onOpenChange={(open) => !open && setInspectingLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>审计日志明细</DialogTitle>
              <DialogDescription>
                日志 ID: <code className="text-xs">{inspectingLog.audit_log_id}</code>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 rounded border bg-muted/10 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">动作标识: </span>
                  <code className="font-semibold">{inspectingLog.action_key}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">记录时间: </span>
                  <span>{formatDateTime(inspectingLog.created_at)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">操作员: </span>
                  <code className="text-[11px]">{inspectingLog.operator_id}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">请求 Request ID: </span>
                  <code className="text-[11px]">{inspectingLog.request_id || '—'}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">IP 地址: </span>
                  <span>{inspectingLog.ip_address || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">执行状态: </span>
                  <StatusBadge tone="success" label="SUCCESS" dot={false} />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold">变更明细载荷 (Details JSON):</p>
                <pre className="max-h-72 overflow-y-auto rounded bg-zinc-950 p-3 font-mono text-xs text-zinc-100 dark:bg-zinc-900">
                  {JSON.stringify(inspectingLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </ListPageLayout>
  )
}
