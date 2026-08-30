import * as React from 'react'
import { PageHeader } from '@/components/common/page-header'
import type { BreadcrumbItem } from '@/components/common/page-header'

export interface ListPageLayoutProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  actions?: React.ReactNode
  children: React.ReactNode
}

/** Standard list page: PageHeader + toolbar/filters + content. */
export function ListPageLayout({
  title,
  description,
  breadcrumb,
  actions,
  children,
}: ListPageLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={title} description={description} breadcrumb={breadcrumb} actions={actions} />
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  )
}
