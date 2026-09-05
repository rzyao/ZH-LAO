import * as React from 'react'
import { PageHeader } from '@/components/common/page-header'
import type { BreadcrumbItem } from '@/components/common/page-header'

export interface ListPageLayoutProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  actions?: React.ReactNode
  /** Contextual controls kept with the sticky page introduction. */
  toolbar?: React.ReactNode
  children: React.ReactNode
}

/** Standard list page: PageHeader + toolbar/filters + content. */
export function ListPageLayout({
  title,
  description,
  breadcrumb,
  actions,
  toolbar,
  children,
}: ListPageLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={title} description={description} breadcrumb={breadcrumb} actions={actions} toolbar={toolbar} />
      <div className="min-h-0 flex-1 overflow-auto px-4 py-6 sm:px-8">{children}</div>
    </div>
  )
}
