import { Hammer } from 'lucide-react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { EmptyState } from '@/components/feedback/empty-state'
import { StatusBadge } from '@/components/common/status-badge'
import type { BreadcrumbItem } from '@/components/common/page-header'

export interface DomainPlaceholderProps {
  /** V2 Domain name, e.g. `content`. */
  domain: string
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
}

/**
 * Uniform placeholder for every not-yet-implemented Domain route.
 * Only navigation entry + coming-soon info — no fake business pages.
 */
export function DomainPlaceholder({ domain, title, description, breadcrumb }: DomainPlaceholderProps) {
  return (
    <ListPageLayout
      title={title}
      description={description ?? `${domain} 业务域`}
      breadcrumb={breadcrumb}
      actions={<StatusBadge tone="muted" label="开发中" />}
    >
      <div className="p-4">
        <EmptyState
          icon={Hammer}
          title={`${title} — 即将上线`}
          description={`${domain} 领域业务模块正在研发中。完成领域契约与后端支持后将在此提供完整管理界面。`}
        />
      </div>
    </ListPageLayout>
  )
}
