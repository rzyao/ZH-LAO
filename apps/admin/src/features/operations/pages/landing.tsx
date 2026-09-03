import { PageHeader } from '@/components/common/page-header'
import { OperationsStageNotice } from '../components'

export function OperationsLandingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="运营权限控制面"
        description="Operations 领域核心控制面：操作员管理、扁平 RBAC 与不可变审计追踪。"
        breadcrumb={[{ label: '系统运维' }, { label: '运营权限' }]}
      />
      <OperationsStageNotice />
      <div className="p-5 text-sm text-muted-foreground">请从左侧二级导航选择要管理的运营模块。</div>
    </div>
  )
}
