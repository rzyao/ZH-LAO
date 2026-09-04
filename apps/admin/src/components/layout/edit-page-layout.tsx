import * as React from 'react'
import { PageHeader } from '@/components/common/page-header'
import type { BreadcrumbItem } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'

export interface EditPageLayoutProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  children: React.ReactNode
  onCancel?: () => void
  onSave?: () => void
  saving?: boolean
  saveLabel?: string
  cancelLabel?: string
}

/** Standard edit page: PageHeader + form content + sticky action bar. */
export function EditPageLayout({
  title,
  description,
  breadcrumb,
  children,
  onCancel,
  onSave,
  saving = false,
  saveLabel = '保存',
  cancelLabel = '取消',
}: EditPageLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={title}
        description={description}
        breadcrumb={breadcrumb}
        actions={
          <>
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              {cancelLabel}
            </Button>
            <Button onClick={onSave} loading={saving}>
              {saveLabel}
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto px-4 py-6 sm:px-8">{children}</div>
    </div>
  )
}
