import { PageHeader } from '@/components/common/page-header'
import { PlatformStageNotice } from '../components'

export function PlatformLandingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="平台控制台"
        description="Platform 平台领域控制面核心功能。"
        breadcrumb={[{ label: '系统运维' }, { label: '平台控制台' }]}
      />
      <PlatformStageNotice />
      <div className="p-5 text-sm text-muted-foreground">请从左侧二级导航选择要管理的平台模块。</div>
    </div>
  )
}
