import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './login'
import { ApiError } from '@/api/errors'

const loginMock = vi.fn<() => Promise<void>>()
const navigateMock = vi.fn()

vi.mock('@/auth/context/AuthContext', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useAuth: () => ({
      status: 'anonymous',
      operator: null,
      permissions: [],
      can: () => false,
      login: loginMock,
      setAuthenticated: vi.fn(),
      signOut: vi.fn(),
    }),
  }
})

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/app/config', () => ({
  env: {
    apiBaseUrl: '/api',
    appEnvironment: 'test',
    enableDesignSystem: false,
    showDefaultAdminHint: true,
  },
}))

beforeEach(() => {
  loginMock.mockReset()
  navigateMock.mockReset()
})

describe('LoginPage (US-001 / FR-002 / FR-004)', () => {
  it('trims the username before submitting and navigates on success', async () => {
    loginMock.mockResolvedValue(undefined)
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText('账号'), '  admin  ')
    await userEvent.type(screen.getByLabelText('密码'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: '登录' }))
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('admin', 'secret'))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: '/' }))
  })

  it('shows the unified anti-enumeration error on invalid credentials', async () => {
    loginMock.mockRejectedValue(new ApiError({ kind: 'unauthorized', status: 401, code: 'INVALID_CREDENTIAL' }))
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText('账号'), 'admin')
    await userEvent.type(screen.getByLabelText('密码'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: '登录' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('账号或密码错误，请重试。')
  })

  it('shows the rate-limit message on 429', async () => {
    loginMock.mockRejectedValue(new ApiError({ kind: 'rate_limit', status: 429, code: 'LOGIN_RATE_LIMITED' }))
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText('账号'), 'admin')
    await userEvent.type(screen.getByLabelText('密码'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: '登录' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('尝试次数过多，请稍后再试。')
  })

  it('rejects empty username/password without calling login (native required blocks submit)', async () => {
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: '登录' }))
    // HTML5 `required` on the inputs prevents the submit handler from running.
    expect(loginMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
