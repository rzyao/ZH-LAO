import { beforeEach, describe, expect, it, vi } from 'vitest'

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }))

vi.mock('@/api/client', () => ({
  apiClient: { post: postMock },
}))

import { operationsAdminApi } from './api'

describe('operationsAdminApi', () => {
  beforeEach(() => postMock.mockReset())

  it('accepts the create-operator payload unwrapped by the shared API client', async () => {
    const data = {
      operator: {
        operator_id: '8a18e3e3-79d7-43f5-8d0e-0ced312c2773',
        auth_subject_id: '4d42613b-5be2-45f1-9cee-e4d983868f04',
        display_name: '123456',
        status: 'active' as const,
        created_at: '2026-09-04T22:44:27.417Z',
        updated_at: '2026-09-04T22:44:27.417Z',
      },
      initial_password: 'gn-rUfj2ZLoBrqKJa1',
    }
    postMock.mockResolvedValue({ data })

    await expect(operationsAdminApi.createOperator({ username: '123456', display_name: '123456' })).resolves.toEqual(data)
    expect(postMock).toHaveBeenCalledWith('/api/v1/admin/operations/operators', {
      json: { username: '123456', display_name: '123456' },
    })
  })

  it('accepts an unwrapped one-time password reset payload', async () => {
    const data = {
      operator: {
        operator_id: '8a18e3e3-79d7-43f5-8d0e-0ced312c2773',
        auth_subject_id: '4d42613b-5be2-45f1-9cee-e4d983868f04',
        display_name: '123456',
        status: 'active' as const,
        created_at: '2026-09-04T22:44:27.417Z',
        updated_at: '2026-09-04T22:44:27.417Z',
      },
      temporary_password: 'one-time-secret',
    }
    postMock.mockResolvedValue({ data })

    await expect(operationsAdminApi.resetOperatorPassword(data.operator.operator_id)).resolves.toEqual(data)
    expect(postMock).toHaveBeenCalledWith('/api/v1/admin/operations/operators/8a18e3e3-79d7-43f5-8d0e-0ced312c2773/password-reset')
  })
})
