import { PageHeader } from '@/components/common/page-header'

export function ContentLandingPage() {
  return (
    <div className="space-y-4" data-testid="content-landing-page">
      <PageHeader
        title="内容管理"
        description="老挝语与中文教学内容体系核心控制台。"
        breadcrumb={[{ label: '学习与内容' }, { label: '内容管理' }]}
      />
      <div className="p-5 text-sm text-muted-foreground">
        请从左侧导航选择中文或老挝语的具体内容类别。
      </div>
    </div>
  )
}
