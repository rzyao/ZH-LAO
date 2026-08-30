import { Button } from '@/components/ui/button'
import { ShieldX } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function UnauthorizedPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background text-foreground">
      <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <ShieldX aria-hidden className="size-6" />
      </div>
      <h1 className="text-lg font-semibold">没有访问权限</h1>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        当前账号没有访问该页面的权限。如需协助请联系运营人员。
      </p>
      <Link to="/">
        <Button variant="outline" className="mt-2">
          返回 Overview
        </Button>
      </Link>
    </div>
  )
}
