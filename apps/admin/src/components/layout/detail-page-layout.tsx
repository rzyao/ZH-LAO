import * as React from 'react'
import { PageHeader } from '@/components/common/page-header'
import type { BreadcrumbItem } from '@/components/common/page-header'

export interface DetailPageLayoutProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  /** Status badge / metadata rendered in the header. */
  status?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

/** Standard detail page: PageHeader + sections content. */
export function DetailPageLayout({
  title,
  description,
  breadcrumb,
  status,
  actions,
  children,
}: DetailPageLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={title}
        description={description}
        breadcrumb={breadcrumb}
        actions={
          <>
            {status}
            {actions}
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
    </div>
  )
}
