import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { env } from '@/app/config'
import { NAV_GROUPS } from '@/navigation/config'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { Card } from '@/components/common/card'
import { InlineLoading } from '@/components/feedback/loading'
import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react'

/** One-shot backend liveness probe. No polling. */
function useBackendHealth() {
  return useQuery({
    queryKey: ['health', 'live'],
    queryFn: async () => {
      const response = await apiClient.get<{ status: string }>('/health/live', {
        timeoutMs: 5000,
      })
      return response.data.status === 'ok'
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}

const FOUNDATION_CAPABILITIES = [
  'AppShell / Sidebar / Header / Breadcrumb',
  'Router（TanStack Router，含 Lazy Loading）',
  'Query Foundation（TanStack Query）',
  'API Client + 统一 Error Contract',
  'DataTable / FilterBar / Pagination',
  'Form Foundation（React Hook Form + Zod）',
  'Feedback：Loading / Empty / Error / Toast / Dialog / Sheet',
  'Auth / Permission Skeleton',
  'UUID / Time / Pagination 全局 Contract',
  'Testing（Vitest / Testing Library / Playwright）',
]

function BackendStatus() {
  const { data, isPending, isError } = useBackendHealth()
  if (isPending) {
    return <InlineLoading label="正在检查后端…" />
  }
  if (isError) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
        <XCircle aria-hidden className="size-4" />
        不可用
      </span>
    )
  }
  return data ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-success">
      <CheckCircle2 aria-hidden className="size-4" />
      可用
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm text-warning">
      <CircleAlert aria-hidden className="size-4" />
      异常
    </span>
  )
}

/**
 * Overview shell. Shows only platform-level information — no fake business
 * KPIs (users / revenue / DAU / reports are NOT shown).
 */
export function OverviewPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="ZH-LAO Admin"
        description="中老语言学习与社交应用 — 后台管理平台"
      />
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="环境">
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">App 环境</dt>
                <dd className="font-medium">{env.appEnvironment}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">API Base URL</dt>
                <dd className="truncate font-mono text-xs">{env.apiBaseUrl}</dd>
              </div>
            </dl>
          </Card>

          <Card title="后端可用性">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Backend</dt>
                <dd>
                  <BackendStatus />
                </dd>
              </div>
              <p className="text-xs text-muted-foreground">
                一次性探测 <code className="font-mono">/health/live</code>，不做高频轮询。
              </p>
            </div>
          </Card>

          <Card title="基础框架状态">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Admin 基础框架</span>
              <StatusBadge tone="success" label="通过" />
            </div>
          </Card>
        </div>

        <Card title="已就绪核心框架能力">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {FOUNDATION_CAPABILITIES.map((capability) => (
              <li key={capability} className="flex items-start gap-2">
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="11 业务领域导航（规划建设中）">
          <div className="flex flex-wrap gap-2">
            {NAV_GROUPS.flatMap((group) =>
              group.items.map((item) => (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1 text-sm"
                >
                  {item.label}
                  <StatusBadge tone="muted" label="开发中" dot={false} />
                </span>
              )),
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            各业务领域页面将在对应研发阶段（契约冻结、后端 API 就绪）后接入完整业务管理功能。
          </p>
        </Card>
      </div>
    </div>
  )
}
