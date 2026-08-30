import * as React from 'react'
import { AlertTriangle, LockKeyhole } from 'lucide-react'
import { ApiError } from '@/api/errors/api-error'
import { useAuth } from '@/auth/context/AuthContext'
import { Card } from '@/components/common/card'
import { StatusBadge } from '@/components/common/status-badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { PlatformPermission } from './contracts'

export function PlatformStageNotice() {
  return (
    <Card className="mb-4 border-dashed p-4">
      <div className="flex gap-3">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Platform Admin Stage A</p>
          <p className="text-sm text-muted-foreground">
            UI and frozen API contracts are implemented. Formal Operations Gate is not PASS yet, so live operator RBAC/audit E2E remains a Stage B dependency.
          </p>
        </div>
      </div>
    </Card>
  )
}

export function useExactPermission(permission: PlatformPermission): boolean {
  const { permissions } = useAuth()
  return permissions.includes(permission)
}

export function PermissionContract({ read, write }: { read: PlatformPermission; write: PlatformPermission }) {
  const { status } = useAuth()
  const hasRead = useExactPermission(read)
  const hasWrite = useExactPermission(write)
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" data-testid="platform-permission-contract">
      <LockKeyhole aria-hidden className="size-3.5" />
      <span>Exact RBAC:</span>
      <StatusBadge tone={status === 'authenticated' && hasRead ? 'success' : 'muted'} label={read} dot={false} />
      <StatusBadge tone={status === 'authenticated' && hasWrite ? 'success' : 'muted'} label={write} dot={false} />
    </div>
  )
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
    </div>
  )
}

export function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  )
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function mutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'conflict' || error.code === 'PLATFORM_CONFLICT') {
      return '数据已被其他操作更新。请重新获取最新数据，确认后再提交；本页面不会静默覆盖。'
    }
    return error.message
  }
  return error instanceof Error ? error.message : '操作失败，请重试。'
}

export function isConflictError(error: unknown): boolean {
  return error instanceof ApiError && (error.kind === 'conflict' || error.code === 'PLATFORM_CONFLICT')
}
