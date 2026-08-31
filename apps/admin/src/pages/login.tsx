import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/api/errors'
import { useAuth } from '@/auth/context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { status, login } = useAuth()
  const [username, setUsername] = React.useState('admin')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (status === 'authenticated') void navigate({ to: '/' })
  }, [navigate, status])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      await navigate({ to: '/' })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : '登录失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">ZH-LAO Admin</h1>
          <p className="text-sm text-muted-foreground">登录后台管理平台</p>
        </div>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="admin-username">账号</Label>
            <Input id="admin-username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="请输入账号" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">密码</Label>
            <Input id="admin-password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="请输入密码" required />
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" type="submit" loading={loading}>
            登录
          </Button>
        </form>
        <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">默认超管账号：admin / 123456</p>
      </div>
    </div>
  )
}
