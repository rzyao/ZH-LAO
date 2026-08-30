import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@tanstack/react-router'

/**
 * Login placeholder (ADM-F13). Real Operator login is implemented by the
 * Identity / Operations phases — this page only fixes the layout contract.
 */
export function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">ZH-LAO Admin</h1>
          <p className="text-sm text-muted-foreground">
            登录功能将在 Identity / Operations 阶段实现。
          </p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="placeholder-email">邮箱</Label>
            <Input id="placeholder-email" placeholder="operator@example.com" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="placeholder-password">密码</Label>
            <Input id="placeholder-password" type="password" placeholder="••••••••" disabled />
          </div>
          <Button className="w-full" disabled>
            登录（即将推出）
          </Button>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            返回 Overview
          </Link>
        </div>
      </div>
    </div>
  )
}
