import { env } from '@/app/config'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, useBreadcrumb } from './breadcrumb'
import { ThemeSwitch } from './theme-switch'

const envLabel: Record<string, string> = {
  development: '开发',
  test: '测试',
  production: '生产',
}

function EnvBadge() {
  const label = envLabel[env.appEnvironment] ?? env.appEnvironment
  return (
    <Badge variant="outline" className="text-muted-foreground" data-testid="env-badge">
      {label}
    </Badge>
  )
}

/** Top header: global breadcrumb + environment + theme switch. */
export function Header() {
  const crumbs = useBreadcrumb()
  return (
    <header
      data-testid="header"
      className="flex h-12 shrink-0 items-center justify-between gap-4 border-b bg-card/60 px-4"
    >
      <Breadcrumb items={crumbs} />
      <div className="flex shrink-0 items-center gap-2">
        <EnvBadge />
        <ThemeSwitch />
      </div>
    </header>
  )
}
