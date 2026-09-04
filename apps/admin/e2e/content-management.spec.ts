import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Route } from '@playwright/test'

const permissions = [
  'content.zh_pinyin_elements.read', 'content.zh_pinyin_elements.write', 'content.zh_pinyin_elements.review', 'content.zh_pinyin_elements.publish',
  'content.zh_syllables.read', 'content.zh_syllables.write', 'content.zh_syllables.review', 'content.zh_syllables.publish',
  'content.zh_hanzi.read', 'content.zh_hanzi.write', 'content.zh_hanzi.review', 'content.zh_hanzi.publish',
  'content.zh_words.read', 'content.zh_words.write', 'content.zh_words.review', 'content.zh_words.publish',
  'content.zh_sentences.read', 'content.zh_sentences.write', 'content.zh_sentences.review', 'content.zh_sentences.publish',
  'content.lo_letters.read', 'content.lo_letters.write', 'content.lo_letters.review', 'content.lo_letters.publish',
  'content.lo_syllables.read', 'content.lo_syllables.write', 'content.lo_syllables.review', 'content.lo_syllables.publish',
  'content.lo_words.read', 'content.lo_words.write', 'content.lo_words.review', 'content.lo_words.publish',
  'content.lo_sentences.read', 'content.lo_sentences.write', 'content.lo_sentences.review', 'content.lo_sentences.publish',
]

type MockHandler = (route: Route, pathname: string) => Promise<boolean> | boolean

function envelope(data: unknown) {
  return JSON.stringify({ code: 'OK', data, request_id: '内容旅程测试' })
}

function item(input: { id: string; type: string; language: 'zh' | 'lo'; status: string; fields: Record<string, unknown>; composition?: Array<{ contentId: string; position: number }> }) {
  return {
    id: input.id,
    language: input.language,
    contentType: input.type,
    status: input.status === 'published' ? 'published' : 'draft',
    revisionId: `${input.id}-revision`,
    revisionNumber: 2,
    revisionStatus: input.status,
    lockVersion: 0,
    snapshot: { fields: input.fields, composition: input.composition ?? [] },
  }
}

async function prepare(page: Page, handler?: MockHandler) {
  await page.addInitScript((grantedPermissions) => {
    window.localStorage.setItem('zh-lao.admin.session', JSON.stringify({
      accessToken: 'content-management-test-token', refreshToken: 'content-management-refresh-token',
      operator: { id: '00000000-0000-4000-8000-000000000001', name: '内容管理员', roleId: 'custom_content_role' },
      permissions: grantedPermissions,
    }))
  }, permissions)
  await page.route('**/*', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/api/v1/admin/operations/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          operator: {
            operator_id: '00000000-0000-4000-8000-000000000001',
            display_name: '内容管理员',
            status: 'active',
            roles: [{ role_id: '00000000-0000-4000-8000-000000000002', code: 'custom_content_role', name: '内容管理员' }],
            permissions,
          },
        }),
      }); return
    }
    if (pathname.startsWith('/api/v1/admin/platform/menus')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ groups: [] }) }); return
    }
    if (pathname.startsWith('/api/v1/admin/content/')) {
      if (handler && await handler(route, pathname)) return
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [], total: 0 }) }); return
    }
    await route.continue()
  })
}

test.describe('中老语言内容管理旅程', () => {
  test('十二个后台页面可直接访问并通过 WCAG-AA 自动检查', async ({ page }) => {
    await prepare(page)
    const routes = [
      ['/content', 'content-landing-page'],
      ['/content/zh/pinyin', 'content-zh-pinyin-page'], ['/content/zh/syllables', 'content-zh-syllables-page'],
      ['/content/zh/hanzi', 'content-zh-hanzi-page'], ['/content/zh/words', 'content-zh-words-page'],
      ['/content/zh/sentences', 'content-zh-sentences-page'], ['/content/zh/review', 'content-zh-review-page'],
      ['/content/lo/letters', 'content-lo-letters-page'], ['/content/lo/syllables', 'content-lo-syllables-page'],
      ['/content/lo/words', 'content-lo-words-page'], ['/content/lo/sentences', 'content-lo-sentences-page'],
      ['/content/lo/review', 'content-lo-review-page'],
    ] as const
    for (const [path, testId] of routes) {
      await page.goto(path)
      await expect(page.getByTestId(testId)).toBeVisible()
      const results = await new AxeBuilder({ page }).include(`[data-testid="${testId}"]`).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations, `${path} 存在严重无障碍问题`).toEqual([])
    }
  })

  test('JRN-001：中文音节可选择已发布拼音并按位置保存', async ({ page }) => {
    let createdSnapshot: unknown
    const pinyin = item({ id: 'pinyin-1', type: 'zh_pinyin_element', language: 'zh', status: 'published', fields: { displayForm: 'm' } })
    await prepare(page, async (route, pathname) => {
      if (pathname.endsWith('/zh/pinyin-elements')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [pinyin], total: 1 }) }); return true
      }
      if (pathname.endsWith('/zh/syllables') && route.request().method() === 'POST') {
        createdSnapshot = (await route.request().postDataJSON()).snapshot
        await route.fulfill({ status: 201, contentType: 'application/json', body: envelope({ status: 'draft' }) }); return true
      }
      return false
    })
    await page.goto('/content/zh/syllables')
    await page.getByRole('button', { name: '新建中文音节' }).click()
    await page.getByLabel('无调形式').fill('ma')
    await page.getByLabel('声调（1—5）').fill('1')
    await page.getByLabel('展示形式').fill('mā')
    await page.getByLabel('拼音元素组成（按添加顺序排列）').selectOption('pinyin-1')
    await page.getByRole('button', { name: '添加' }).click()
    await page.getByRole('button', { name: '保存草稿' }).click()
    await expect.poll(() => createdSnapshot).toMatchObject({ composition: [{ contentId: 'pinyin-1', position: 1 }] })
  })

  test('JRN-002：中文词语可比较版本并查看反向引用', async ({ page }) => {
    const word = item({ id: 'word-1', type: 'zh_word', language: 'zh', status: 'draft', fields: { simplified: '妈妈', difficultyLevel: 1 } })
    await prepare(page, async (route, pathname) => {
      if (pathname.endsWith('/zh/words')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [word], total: 1 }) }); return true
      }
      if (pathname.endsWith('/history')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [
          { revisionId: 'word-1-revision', revisionNumber: 2, status: 'draft', snapshot: { fields: { simplified: '妈妈', difficultyLevel: 1 }, composition: [] }, reviewRemark: null, createdAt: '2026-09-04' },
          { revisionId: 'word-1-old', revisionNumber: 1, status: 'published', snapshot: { fields: { simplified: '妈妈', difficultyLevel: 2 }, composition: [] }, reviewRemark: null, createdAt: '2026-09-03' },
        ], total: 2 }) }); return true
      }
      if (pathname.endsWith('/references')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [{ contentId: 'sentence-1', contentType: 'zh_sentence', position: 1 }], total: 1 }) }); return true
      }
      return false
    })
    await page.goto('/content/zh/words')
    await page.getByRole('button', { name: '版本与引用' }).click()
    await expect(page.getByRole('heading', { name: '版本比较' })).toBeVisible()
    await expect(page.getByText('（有变化）').first()).toBeVisible()
    await expect(page.getByText(/汉字|句子/).last()).toBeVisible()
  })

  test('JRN-003：老挝语音节只显示已发布字母依赖', async ({ page }) => {
    const letter = item({ id: 'letter-1', type: 'lo_letter', language: 'lo', status: 'published', fields: { character: 'ຂ' } })
    await prepare(page, async (route, pathname) => {
      if (pathname.endsWith('/lo/letters')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [letter], total: 1 }) }); return true
      }
      return false
    })
    await page.goto('/content/lo/syllables')
    await page.getByRole('button', { name: '新建音节' }).click()
    await expect(page.getByLabel('老挝语字母组成（按添加顺序排列）').getByRole('option', { name: 'ຂ' })).toBeAttached()
  })

  test('JRN-004：老挝语词语空状态保留创建入口', async ({ page }) => {
    await prepare(page)
    await page.goto('/content/lo/words')
    await expect(page.getByText('暂无词语内容')).toBeVisible()
    await expect(page.getByRole('button', { name: '新建词语' })).toBeEnabled()
    await page.getByRole('textbox', { name: '搜索词语' }).fill('不存在')
    await expect(page.getByText('暂无词语内容')).toBeVisible()
  })

  test('JRN-005：审核人员先看差异，再确认发布并看到结构化阻塞项', async ({ page }) => {
    const approved = item({ id: 'word-approved', type: 'zh_word', language: 'zh', status: 'approved', fields: { simplified: '学习', difficultyLevel: 1 } })
    await prepare(page, async (route, pathname) => {
      if (pathname.endsWith('/zh/words') && route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [approved], total: 1 }) }); return true
      }
      if (pathname.endsWith('/history')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [{ revisionId: 'word-approved-revision', revisionNumber: 2, status: 'approved', snapshot: { fields: { simplified: '学习', difficultyLevel: 1 }, composition: [] }, reviewRemark: null, createdAt: '2026-09-04' }], total: 1 }) }); return true
      }
      if (pathname.endsWith('/references')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [], total: 0 }) }); return true
      }
      if (pathname.endsWith('/publish')) {
        await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'INVALID_DATA', message: '下级依赖尚未发布：hanzi-2', request_id: '发布阻塞测试' }) }); return true
      }
      return false
    })
    await page.goto('/content/zh/review')
    await page.getByRole('button', { name: '查看版本差异' }).click()
    await expect(page.getByRole('heading', { name: '版本比较' })).toBeVisible()
    await page.getByRole('dialog').getByText('关闭', { exact: true }).click()
    await page.getByRole('button', { name: '执行发布预检并发布' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: '确认发布' }).click()
    await expect(page.getByRole('alert', { name: '发布阻塞' })).toContainText('hanzi-2')
  })
})
