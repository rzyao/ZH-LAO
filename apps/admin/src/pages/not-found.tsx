import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background text-foreground">
      <div className="flex size-12 items-center justify-center rounded-lg border bg-card text-lg font-bold">
        404
      </div>
      <h1 className="text-lg font-semibold">页面不存在</h1>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        你访问的地址不存在或已被移动。
      </p>
      <Link to="/">
        <Button variant="outline" className="mt-2">
          返回 Overview
        </Button>
      </Link>
    </div>
  )
}
