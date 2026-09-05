import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { assertUuid } from '@/api/contracts'
import { writeAdminSession, readAdminSession } from '../session-store'
import { getAccessToken, setAccessToken } from '../token-store'

const { loginAdminMock, getCurrentOperatorMock, changeAdminPasswordMock } = vi.hoisted(() => ({
  loginAdminMock: vi.fn(),
  getCurrentOperatorMock: vi.fn(),
  changeAdminPasswordMock: vi.fn(),
}))

vi.mock('../api', () => ({
  loginAdmin: loginAdminMock,
  logoutAdmin: vi.fn(),
  getCurrentOperator: getCurrentOperatorMock,
  changeAdminPassword: changeAdminPasswordMock,
}))

function TestConsumer() {
  const { status, operator, permissions, login, refreshPermissions, changePassword } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="operator-name">{operator?.name}</span>
      <span data-testid="permissions">{permissions.join(',')}</span>
      <button data-testid="btn-refresh" onClick={() => void refreshPermissions()}>
        Refresh
      </button>
      <button data-testid="btn-login" onClick={() => void login('admin', 'temporary-password')}>
        Login
      </button>
      <button
        data-testid="btn-change-password"
        onClick={() => void changePassword('old', 'new')}
      >
        Change Password
      </button>
    </div>
  )
}

describe('AuthContext - session restoration, 403 recovery & change password', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setAccessToken(null)
    loginAdminMock.mockReset()
    getCurrentOperatorMock.mockReset()
    changeAdminPasswordMock.mockReset()
  })

  it('restores persisted session on mount', () => {
    const operator = { id: assertUuid('00000000-0000-4000-8000-000000000001'), name: 'Alice', roleId: 'admin' }
    writeAdminSession({
      accessToken: 'acc',
      refreshToken: 'ref',
      operator,
      permissions: ['operations.read'],
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('operator-name')).toHaveTextContent('Alice')
    expect(screen.getByTestId('permissions')).toHaveTextContent('operations.read')
  })

  it('恢复会话后自动从服务端刷新权限（SC-007）', async () => {
    const operator = { id: assertUuid('00000000-0000-4000-8000-000000000001'), name: 'Alice', roleId: 'admin' }
    writeAdminSession({
      accessToken: 'acc',
      refreshToken: 'ref',
      operator,
      permissions: ['operations.read'],
    })

    getCurrentOperatorMock.mockResolvedValue({
      operator: { id: operator.id, name: 'Alice', roleId: 'super_admin' },
      permissions: ['operations.read', 'operations.write', 'platform.*.*'],
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(getCurrentOperatorMock).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('permissions')).toHaveTextContent('operations.read,operations.write,platform.*.*')
    })
    expect(readAdminSession()?.permissions).toEqual(['operations.read', 'operations.write', 'platform.*.*'])
  })

  it('changePassword clears session and resets auth to anonymous', async () => {
    const operator = { id: assertUuid('00000000-0000-4000-8000-000000000001'), name: 'Alice', roleId: 'admin' }
    writeAdminSession({
      accessToken: 'acc',
      refreshToken: 'ref',
      operator,
      permissions: ['operations.read'],
    })

    changeAdminPasswordMock.mockResolvedValue(undefined)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')

    await act(async () => {
      screen.getByTestId('btn-change-password').click()
    })

    expect(changeAdminPasswordMock).toHaveBeenCalledWith('old', 'new')
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    expect(readAdminSession()).toBeNull()
  })

  it('keeps a temporary-password session in memory and does not request operator data', async () => {
    loginAdminMock.mockResolvedValue({
      user_id: '00000000-0000-4000-8000-000000000001',
      access_token: 'restricted-access',
      refresh_token: 'restricted-refresh',
      password_change_required: true,
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await act(async () => {
      screen.getByTestId('btn-login').click()
    })

    expect(getCurrentOperatorMock).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe('restricted-access')
    expect(readAdminSession()).toBeNull()
  })
})
