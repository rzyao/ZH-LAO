import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import {
  CONTENT_CATEGORY_CONFIGS,
  LaoLetterListDataSchema,
  LaoLetterSearchSchema,
} from './contracts'
import { laoLetterAdminApi } from './api'
import { laoLetterQueryKeys } from './queries'
import { laoLetterListFixture } from './lo-letter-test-fixtures'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

beforeEach(() => {
  vi.mocked(apiClient.get).mockReset()
})

describe('中老内容页面配置', () => {
  it('登记五个中文类别和四个老挝语类别，并使用不同接口路径', () => {
    const configs = Object.values(CONTENT_CATEGORY_CONFIGS)
    expect(configs.filter((item) => item.languageCode === 'zh')).toHaveLength(5)
    expect(configs.filter((item) => item.languageCode === 'lo')).toHaveLength(4)
    expect(new Set(configs.map((item) => item.apiPath)).size).toBe(9)
    expect(new Set(configs.map((item) => item.testId)).size).toBe(9)
  })

  it('页面组成链路与中文、老挝语权威层级一致', () => {
    expect(CONTENT_CATEGORY_CONFIGS.zh_syllable.dependencyType).toBe('zh_pinyin_element')
    expect(CONTENT_CATEGORY_CONFIGS.zh_hanzi.dependencyType).toBe('zh_syllable')
    expect(CONTENT_CATEGORY_CONFIGS.zh_word.dependencyType).toBe('zh_hanzi')
    expect(CONTENT_CATEGORY_CONFIGS.zh_sentence.dependencyType).toBe('zh_word')
    expect(CONTENT_CATEGORY_CONFIGS.lo_syllable.dependencyType).toBe('lo_letter')
    expect(CONTENT_CATEGORY_CONFIGS.lo_word.dependencyType).toBe('lo_syllable')
    expect(CONTENT_CATEGORY_CONFIGS.lo_sentence.dependencyType).toBe('lo_word')
  })
})

describe('Lao-letter list contracts', () => {
  const search = {
    q: 'ກ',
    letter_type: ['consonant', 'vowel'] as const,
    letter_class: ['cons_high'],
    content_status: ['active'] as const,
    revision_status: ['draft', 'none'] as const,
    sort: 'updated_at' as const,
    order: 'desc' as const,
    page: 3,
    page_size: 100,
  }

  it('parses the UUID-only OpenAPI DTO and rejects unknown/internal fields', () => {
    expect(LaoLetterListDataSchema.parse(laoLetterListFixture)).toEqual(laoLetterListFixture)
    expect(LaoLetterListDataSchema.safeParse({
      ...laoLetterListFixture,
      items: [{ ...laoLetterListFixture.items[0], internal_id: '42' }],
    }).success).toBe(false)
    expect(LaoLetterListDataSchema.safeParse({
      ...laoLetterListFixture,
      items: [{ ...laoLetterListFixture.items[0], content_id: 'not-a-uuid' }],
    }).success).toBe(false)
  })

  it('strictly validates and canonicalizes Router/API search values', () => {
    expect(LaoLetterSearchSchema.parse({
      q: '  e\u0301  ',
      letter_type: 'vowel,consonant,vowel',
      letter_class: 'cons_middle,cons_high',
      content_status: 'disabled,active',
      revision_status: 'none,draft',
      sort: 'updated_at',
      order: 'desc',
      page: '3',
      page_size: '100',
    })).toEqual({
      q: 'é',
      letter_type: ['consonant', 'vowel'],
      letter_class: ['cons_high', 'cons_middle'],
      content_status: ['active', 'disabled'],
      revision_status: ['draft', 'none'],
      sort: 'updated_at',
      order: 'desc',
      page: 3,
      page_size: 100,
    })
    expect(LaoLetterSearchSchema.safeParse({ page_size: 501 }).success).toBe(false)
    expect(LaoLetterSearchSchema.safeParse({ unknown: 'value' }).success).toBe(false)
  })

  it('includes every normalized query and pagination field in a stable query key', () => {
    expect(laoLetterQueryKeys.list(search)).toEqual([
      'content-admin',
      'lo-letter-list',
      search,
    ])
    expect(laoLetterQueryKeys.list({ ...search, page: 4 })).not.toEqual(
      laoLetterQueryKeys.list(search),
    )
    expect(laoLetterQueryKeys.list({ ...search, letter_type: ['consonant'] })).not.toEqual(
      laoLetterQueryKeys.list(search),
    )
  })

  it('serializes only approved snake_case parameters and forwards AbortSignal', async () => {
    const controller = new AbortController()
    vi.mocked(apiClient.get).mockResolvedValue({
      data: laoLetterListFixture,
      status: 200,
      requestId: 'req-lo-list',
    })

    await expect(laoLetterAdminApi.list(search, controller.signal)).resolves.toEqual(laoLetterListFixture)
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/admin/content/lo/letters?q=%E0%BA%81&letter_type=consonant%2Cvowel&letter_class=cons_high&content_status=active&revision_status=draft%2Cnone&sort=updated_at&order=desc&page=3&page_size=100',
      { signal: controller.signal },
    )
  })
})
