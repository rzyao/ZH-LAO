import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/api/errors'
import { env } from '@/app/config'
import { useAuth } from '@/auth/context/AuthContext'

/** Unified anti-enumeration message (FR-004): never distinguishes unknown vs. wrong. */
const GENERIC_AUTH_ERROR = '账号或密码错误，请重试。'

export function LoginPage() {
  const navigate = useNavigate()
  const { status, login } = useAuth()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (status === 'authenticated') void navigate({ to: '/' })
  }, [navigate, status])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    // FR-002: normalize the username (trim) before submission; the backend also
    // lowercases, but the client trims to avoid sending obvious whitespace.
    const normalizedUsername = username.trim()
    if (!normalizedUsername || !password) {
      setError(GENERIC_AUTH_ERROR)
      return
    }
    setLoading(true)
    try {
      await login(normalizedUsername, password)
      await navigate({ to: '/' })
    } catch (cause) {
      // FR-004: map all authentication failures to one message so the client
      // never reveals whether the username or password was wrong.
      if (cause instanceof ApiError && cause.kind === 'rate_limit') {
        setError('尝试次数过多，请稍后再试。')
      } else {
        setError(GENERIC_AUTH_ERROR)
      }
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
        {env.showDefaultAdminHint ? (
          <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">默认超管账号：admin / 123456</p>
        ) : null}
      </div>
    </div>
  )
}
