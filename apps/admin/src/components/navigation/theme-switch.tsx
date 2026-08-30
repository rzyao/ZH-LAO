import { Moon, Monitor, Sun } from 'lucide-react'
import { useTheme } from '@/design-system/theme/use-theme'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Light / Dark / System theme switch. */
export function ThemeSwitch() {
  const { setMode } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="切换主题" data-testid="theme-switch">
            <Sun aria-hidden className="size-4 dark:hidden" />
            <Moon aria-hidden className="hidden size-4 dark:block" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setMode('light')}>浅色</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('dark')}>深色</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('system')}>跟随系统</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { Monitor as MonitorIcon }
