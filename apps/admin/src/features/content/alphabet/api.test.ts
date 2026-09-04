import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  apiClient: {
    get: getMock,
    post: postMock,
  },
}))

import { alphabetAdminApi } from './api'

describe('alphabetAdminApi', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
  })

  it('uses the shared authenticated API client for the character list', async () => {
    getMock.mockResolvedValue({ data: { items: [] } })

    await expect(alphabetAdminApi.listCharacters()).resolves.toEqual({ items: [] })
    expect(getMock).toHaveBeenCalledWith('/api/v1/admin/content/letters')
  })

  it('uses the shared authenticated API client when creating a character', async () => {
    postMock.mockResolvedValue({ data: { id: 'letter-1' } })
    const input = {
      unicodeChar: 'ກ',
      classification: 'consonant' as const,
      subtype: 'cons_middle',
      ipaPhonetic: '/k/',
      description: 'Ko',
      sortOrder: 1,
    }

    await expect(alphabetAdminApi.createCharacter(input)).resolves.toEqual({ id: 'letter-1' })
    expect(postMock).toHaveBeenCalledWith('/api/v1/admin/content/letters', { json: input })
  })
})
