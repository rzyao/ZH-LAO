import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChangePasswordPage } from './change-password'
import { ApiError } from '@/api/errors'

const changePasswordMock = vi.fn<() => Promise<void>>()
const navigateMock = vi.fn()

vi.mock('@/auth/context/AuthContext', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useAuth: () => ({
      status: 'authenticated',
      operator: { id: '00000000-0000-4000-8000-000000000001', name: 'admin', roleId: 'super_admin' },
      permissions: ['*'],
      can: () => true,
      login: vi.fn(),
      setAuthenticated: vi.fn(),
      signOut: vi.fn(),
      refreshPermissions: vi.fn(),
      changePassword: changePasswordMock,
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

beforeEach(() => {
  changePasswordMock.mockReset()
  navigateMock.mockReset()
})

describe('ChangePasswordPage (US-004 / FR-011)', () => {
  it('validates password equality and strength before submitting', async () => {
    render(<ChangePasswordPage />)

    // 1. Passwords mismatch
    await userEvent.type(screen.getByLabelText('当前密码'), 'OldPassword123')
    await userEvent.type(screen.getByLabelText('新密码'), 'NewPassword123')
    await userEvent.type(screen.getByLabelText('确认新密码'), 'MismatchPassword123')
    await userEvent.click(screen.getByRole('button', { name: '确认修改' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('两次输入的新密码不一致')
    expect(changePasswordMock).not.toHaveBeenCalled()

    // 2. Same as current password
    await userEvent.clear(screen.getByLabelText('新密码'))
    await userEvent.clear(screen.getByLabelText('确认新密码'))
    await userEvent.type(screen.getByLabelText('新密码'), 'OldPassword123')
    await userEvent.type(screen.getByLabelText('确认新密码'), 'OldPassword123')
    await userEvent.click(screen.getByRole('button', { name: '确认修改' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('新密码不能与当前密码相同')
    expect(changePasswordMock).not.toHaveBeenCalled()

    // 3. Password too weak (no digit)
    await userEvent.clear(screen.getByLabelText('新密码'))
    await userEvent.clear(screen.getByLabelText('确认新密码'))
    await userEvent.type(screen.getByLabelText('新密码'), 'OnlyLettersNoDigits')
    await userEvent.type(screen.getByLabelText('确认新密码'), 'OnlyLettersNoDigits')
    await userEvent.click(screen.getByRole('button', { name: '确认修改' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('新密码长度需为 8-128 位且包含至少一个字母和一个数字')
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('submits valid password, calls changePassword, and navigates to /login', async () => {
    changePasswordMock.mockResolvedValue(undefined)
    render(<ChangePasswordPage />)

    await userEvent.type(screen.getByLabelText('当前密码'), 'OldPassword123')
    await userEvent.type(screen.getByLabelText('新密码'), 'ValidSecret456')
    await userEvent.type(screen.getByLabelText('确认新密码'), 'ValidSecret456')
    await userEvent.click(screen.getByRole('button', { name: '确认修改' }))

    await waitFor(() => {
      expect(changePasswordMock).toHaveBeenCalledWith('OldPassword123', 'ValidSecret456')
    })
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login' })
    })
  })

  it('maps 401 INVALID_CREDENTIAL to user-friendly error message', async () => {
    changePasswordMock.mockRejectedValue(
      new ApiError({ kind: 'unauthorized', status: 401, code: 'INVALID_CREDENTIAL', message: 'Invalid credentials' }),
    )
    render(<ChangePasswordPage />)

    await userEvent.type(screen.getByLabelText('当前密码'), 'WrongOldPassword1')
    await userEvent.type(screen.getByLabelText('新密码'), 'ValidSecret456')
    await userEvent.type(screen.getByLabelText('确认新密码'), 'ValidSecret456')
    await userEvent.click(screen.getByRole('button', { name: '确认修改' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('当前密码错误')
  })

  it('maps 400 VALIDATION_ERROR to message', async () => {
    changePasswordMock.mockRejectedValue(
      new ApiError({ kind: 'validation', status: 400, code: 'VALIDATION_ERROR', message: 'New password must differ from current password' }),
    )
    render(<ChangePasswordPage />)

    await userEvent.type(screen.getByLabelText('当前密码'), 'OldPassword123')
    await userEvent.type(screen.getByLabelText('新密码'), 'ValidSecret456')
    await userEvent.type(screen.getByLabelText('确认新密码'), 'ValidSecret456')
    await userEvent.click(screen.getByRole('button', { name: '确认修改' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('New password must differ from current password')
  })
})
