import { Link } from '@tanstack/react-router'
import { FileText, Shield, Users } from 'lucide-react'
import { Card } from '@/components/common/card'
import { PageHeader } from '@/components/common/page-header'
import { OperationsStageNotice } from '../components'

const modules = [
  {
    href: '/operations/operators',
    title: '操作员管理 (Operators)',
    description: '管理后台操作员账户、关联用户身份、查看与分配角色权限。',
    icon: Users,
  },
  {
    href: '/operations/roles',
    title: '角色与权限矩阵 (Roles & Permissions)',
    description: '定义系统管理角色，通过三段式静态权限矩阵进行整量授权配置。',
    icon: Shield,
  },
  {
    href: '/operations/audit-logs',
    title: '操作审计日志 (Audit Logs)',
    description: '不可变追加日志流，多维度追溯后台操作员的所有敏感变更与操作详情。',
    icon: FileText,
  },
] as const

export function OperationsLandingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="运营权限控制面"
        description="Operations 领域核心控制面：操作员管理、扁平 RBAC 与不可变审计追踪。"
        breadcrumb={[{ label: '系统运维' }, { label: '运营权限' }]}
      />
      <OperationsStageNotice />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link
              key={module.href}
              to={module.href}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
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
