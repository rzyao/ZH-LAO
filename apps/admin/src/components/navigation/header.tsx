import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { env } from '@/app/config'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, useBreadcrumb } from './breadcrumb'
import { ThemeSwitch } from './theme-switch'
import { useAuth } from '@/auth/context/AuthContext'
import { Button } from '@/components/ui/button'

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
export function Header({ onOpenNavigation }: { onOpenNavigation?: () => void }) {
  const crumbs = useBreadcrumb()
  const { operator, signOut } = useAuth()
  return (
    <header
      data-testid="header"
      className="flex h-12 shrink-0 items-center justify-between gap-4 border-b bg-card/95 px-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        {onOpenNavigation ? (
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="打开导航" onClick={onOpenNavigation}>
            <Menu aria-hidden className="size-[18px]" />
          </Button>
        ) : null}
        <Breadcrumb items={crumbs} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <EnvBadge />
        {operator ? <span className="hidden text-xs text-muted-foreground sm:inline">{operator.name}</span> : null}
        {operator ? (
          <Link to="/change-password" className="hidden sm:block">
            <Button variant="ghost" size="sm">修改密码</Button>
          </Link>
        ) : null}
        {operator ? <Button variant="ghost" size="sm" onClick={signOut}>退出</Button> : null}
        <ThemeSwitch />
      </div>
    </header>
  )
}
