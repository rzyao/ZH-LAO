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
      description={description ?? `${domain} Domain`}
      breadcrumb={breadcrumb}
      actions={<StatusBadge tone="muted" label="Coming Soon" />}
    >
      <div className="p-4">
        <EmptyState
          icon={Hammer}
          title={`${title} — Coming Soon`}
          description={`${domain} Domain 尚未开发。对应 Domain Phase 完成 Contract 后将在此实现业务页面。`}
        />
      </div>
    </ListPageLayout>
  )
}
