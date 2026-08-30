import { Link } from '@tanstack/react-router'
import { Bell, Flag, Globe2, Settings2, Smartphone } from 'lucide-react'
import { Card } from '@/components/common/card'
import { PageHeader } from '@/components/common/page-header'
import { PlatformStageNotice } from '../components'

const modules = [
  { href: '/platform/feature-flags', title: 'Feature Flags', description: 'Lifecycle, default state and scoped overrides.', icon: Flag },
  { href: '/platform/runtime-configs', title: 'Runtime Configs', description: 'Typed registry-backed current values with conflict protection.', icon: Settings2 },
  { href: '/platform/app-versions', title: 'App Versions', description: 'Numeric build policy, drafts, publish and update policy.', icon: Smartphone },
  { href: '/platform/announcements', title: 'Announcements', description: 'Draft, publish and retire scoped service announcements.', icon: Bell },
  { href: '/platform/regions', title: 'Regions', description: 'Product regions, locale/timezone and lifecycle state.', icon: Globe2 },
] as const

export function PlatformLandingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Platform"
        description="Platform Domain management surfaces. No synthetic KPI is shown."
        breadcrumb={[{ label: 'System' }, { label: 'Platform' }]}
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
