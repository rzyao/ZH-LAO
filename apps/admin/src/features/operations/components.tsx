import * as React from 'react'
import { AlertTriangle, LockKeyhole } from 'lucide-react'
import { ApiError } from '@/api/errors/api-error'
import { useAuth } from '@/auth/context/AuthContext'
import { Card } from '@/components/common/card'
import { StatusBadge } from '@/components/common/status-badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { OperationsPermission } from './contracts'

export function OperationsStageNotice() {
  return (
    <Card className="mb-4 border-dashed p-4">
      <div className="flex gap-3">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">运营权限控制面 (Operations Control Plane)</p>
          <p className="text-sm text-muted-foreground">
            基于 ADR-019 扁平 RBAC 与不可变审计日志规范。权限直查 PostgreSQL 事务快照，修改即时生效。
          </p>
        </div>
      </div>
    </Card>
  )
}

export function useExactPermission(permission: OperationsPermission): boolean {
  const { permissions } = useAuth()
  return permissions.includes(permission)
}

export function PermissionContract({ read, write }: { read: OperationsPermission; write?: OperationsPermission }) {
  const { status, permissions } = useAuth()
  const hasRead = permissions.includes(read)
  const hasWrite = write ? permissions.includes(write) : true
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" data-testid="operations-permission-contract">
      <LockKeyhole aria-hidden className="size-3.5" />
      <span>所需 RBAC 权限：</span>
      <StatusBadge tone={status === 'authenticated' && hasRead ? 'success' : 'muted'} label={read} dot={false} />
      {write ? (
        <StatusBadge tone={status === 'authenticated' && hasWrite ? 'success' : 'muted'} label={write} dot={false} />
      ) : null}
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
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
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
    if (error.code === 'LAST_SUPER_ADMIN') {
      return '安全不变量拦截：系统必须保留至少一位激活状态的超级管理员（super_admin），无法执行该操作。'
    }
    if (error.code === 'OPERATOR_DISABLED') {
      return '当前操作员处于禁用状态，操作被拒绝。'
    }
    return error.message
  }
  return error instanceof Error ? error.message : '操作失败，请重试。'
}
