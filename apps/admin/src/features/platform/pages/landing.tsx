import { Link } from '@tanstack/react-router'
import { Bell, Flag, Globe2, Settings2, Smartphone } from 'lucide-react'
import { Card } from '@/components/common/card'
import { PageHeader } from '@/components/common/page-header'
import { PlatformStageNotice } from '../components'

const modules = [
  { href: '/platform/feature-flags', title: '功能开关 (Feature Flags)', description: '管理生命周期、默认状态与针对特定范围的灰度覆盖规则。', icon: Flag },
  { href: '/platform/runtime-configs', title: '运行时配置 (Runtime Configs)', description: '基于注册表的强类型运行时参数，具备乐观锁冲突保护。', icon: Settings2 },
  { href: '/platform/app-versions', title: '客户端版本治理 (App Versions)', description: '构建号规则、版本发布、最低支持版本与强制升级策略。', icon: Smartphone },
  { href: '/platform/announcements', title: '全服与定向公告 (Announcements)', description: '草稿编排、定向人群发布与服务停机/运营公告下线管理。', icon: Bell },
  { href: '/platform/regions', title: '支持地区管理 (Regions)', description: '产品开放地区、语言/时区配置与区域生命周期状态。', icon: Globe2 },
] as const

export function PlatformLandingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="平台控制台"
        description="Platform 平台领域控制面核心功能。"
        breadcrumb={[{ label: '系统运维' }, { label: '平台控制台' }]}
      />
      <PlatformStageNotice />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.href} to={module.href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <div className="flex gap-3">
                  <Icon aria-hidden className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-sm font-semibold">{module.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
