import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/common/card'
import { ApiError } from '@/api/errors'
import { useAuth } from '@/auth/context/AuthContext'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('请填写所有密码字段')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    if (newPassword === currentPassword) {
      setError('新密码不能与当前密码相同')
      return
    }

    // Password strength check (8-128 characters, at least one letter and one number)
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(newPassword)) {
      setError('新密码长度需为 8-128 位且包含至少一个字母和一个数字')
      return
    }

    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      // Redirect to login page upon password change
      await navigate({ to: '/login' })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.code === 'INVALID_CREDENTIAL') {
          setError('当前密码错误')
        } else if (err.status === 400 || err.code === 'VALIDATION_ERROR') {
          setError(err.message || '新密码格式不符合要求')
        } else {
          setError('修改密码失败，请重试')
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('修改密码失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center px-4 py-8">
      <Card
        title="修改登录密码"
        description="修改当前管理员密码。成功后所有活跃会话将被撤销，需重新登录。"
        className="w-full max-w-md"
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="current-password">当前密码</Label>
            <Input
              id="current-password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              placeholder="请输入当前密码"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">新密码</Label>
            <Input
              id="new-password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              placeholder="8-128位，包含字母和数字"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认新密码</Label>
            <Input
              id="confirm-password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              placeholder="请再次输入新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              密码修改成功，正在跳转登录页...
            </p>
          ) : null}

          <Button className="w-full" type="submit" loading={loading}>
            确认修改
          </Button>
        </form>
      </Card>
    </div>
  )
}
