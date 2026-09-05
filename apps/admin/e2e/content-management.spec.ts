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

type MockHandler = (route: Route, pathname: string, requestUrl: URL) => Promise<boolean> | boolean

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
    const requestUrl = new URL(route.request().url())
    const pathname = requestUrl.pathname
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
      if (handler && await handler(route, pathname, requestUrl)) return
      if (pathname === '/api/v1/admin/content/lo/letters/batch-tasks' && route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [], page: 1, page_size: 20, total: 0 }) }); return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [], total: 0 }) }); return
    }
    await route.continue()
  })
}

test.describe('中老语言内容管理旅程', () => {
  test('TC-E2E-001：Lao 字母 URL 搜索筛选排序分页可刷新恢复', async ({ page }) => {
    const seenQueries: string[] = []
    await prepare(page, async (route, pathname, requestUrl) => {
      if (pathname !== '/api/v1/admin/content/lo/letters' || route.request().method() !== 'GET') return false
      seenQueries.push(requestUrl.search)
      const q = requestUrl.searchParams.get('q') ?? 'ຂ'
      const pageNumber = Number(requestUrl.searchParams.get('page') ?? '1')
      const pageSize = Number(requestUrl.searchParams.get('page_size') ?? '50')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          items: [{
            content_id: '10000000-0000-4000-8000-000000000001',
            character: q,
            letter_type: 'consonant',
            letter_class: 'cons_middle',
            name: 'fixture letter',
            romanization: 'k',
            sort_order: 1,
            content_status: 'active',
            working_revision_id: null,
            working_revision_status: null,
            lock_version: null,
            updated_at: '2026-09-05T01:00:00.000Z',
            available_actions: ['archive'],
          }],
          page: pageNumber,
          page_size: pageSize,
          total: 126,
          batch_actions: ['archive'],
        }),
      })
      return true
    })

    const initial = '/content/lo/letters?q=%E0%BA%82&letter_type=consonant&letter_class=cons_middle&content_status=active&revision_status=none&sort=name&order=desc&page=2&page_size=50'
    await page.goto(initial)
    await expect.poll(() => seenQueries.at(-1)).toContain('letter_type=consonant')
    await expect.poll(() => seenQueries.at(-1)).toContain('sort=name')
    await expect.poll(() => seenQueries.at(-1)).toContain('page=2')
    await expect(page.getByRole('textbox', { name: '搜索字母' })).toHaveValue('ຂ')
    await expect(page.getByText('ຂ', { exact: true })).toBeVisible()
    await expect(page.getByText('第 2 / 3 页')).toBeVisible()
    await page.getByRole('button', { name: '操作 ຂ' }).click()
    await expect(page.getByRole('alert')).toContainText('已选择 ຂ')
    await expect(page.getByRole('button', { name: '批量归档' })).toBeVisible()

    await page.reload()
    await expect(page).toHaveURL(initial)
    await expect(page.getByRole('textbox', { name: '搜索字母' })).toHaveValue('ຂ')
    await expect(page.getByRole('combobox', { name: '字母类型' })).toContainText('辅音')
    await expect(page.getByRole('combobox', { name: '排序字段' })).toContainText('名称')
    await expect(page.getByRole('columnheader', { name: '操作' })).toHaveCSS('position', 'sticky')
    await page.getByRole('button', { name: '列', exact: true }).click()
    await page.getByRole('menuitemcheckbox', { name: '字母类型' }).click()
    await expect(page.getByRole('columnheader', { name: '字母类型' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await expect(page).toHaveURL(/page=3/u)
    await expect.poll(() => seenQueries.at(-1)).toContain('page=3')

    await page.getByRole('textbox', { name: '搜索字母' }).fill('ຄ')
    await expect(page).toHaveURL(/q=%E0%BA%84/u)
    await expect(page).toHaveURL(/page=1/u)
    await expect(page.getByText('ຄ', { exact: true })).toBeVisible()
  })

  test('TC-E2E-002：页内全选后显式升级为当前查询全部', async ({ page }) => {
    let previewBody: Record<string, unknown> | undefined
    let listRequests = 0
    const taskId = '20000000-0000-4000-8000-000000000126'
    await prepare(page, async (route, pathname) => {
      if (pathname === '/api/v1/admin/content/lo/letters/selection-preview') {
        previewBody = route.request().postDataJSON() as Record<string, unknown>
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          query: { q: 'ກ', letter_type: ['consonant'], letter_class: [], content_status: ['active'], revision_status: [], sort: 'sort_order', order: 'asc' },
          expected_count: 126,
          selection_hash: 'a'.repeat(64),
        }) }); return true
      }
      if (pathname === '/api/v1/admin/content/lo/letters/batch-tasks' && route.request().method() === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          task_id: taskId, action: 'approve', selection_mode: 'query_all', status: 'queued', target_count: 126,
          processed_count: 0, succeeded_count: 0, failed_count: 0, skipped_count: 0, last_error_code: null,
          created_at: '2026-09-05T01:00:00.000Z', started_at: null, completed_at: null,
        }) }); return true
      }
      if (pathname === `/api/v1/admin/content/lo/letters/batch-tasks/${taskId}`) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          task: { task_id: taskId, action: 'approve', selection_mode: 'query_all', status: 'completed', target_count: 126, processed_count: 126, succeeded_count: 126, failed_count: 0, skipped_count: 0, last_error_code: null, created_at: '2026-09-05T01:00:00.000Z', started_at: '2026-09-05T01:00:01.000Z', completed_at: '2026-09-05T01:00:03.000Z' },
          items: [], page: 1, page_size: 20, total: 126,
        }) }); return true
      }
      if (pathname === '/api/v1/admin/content/lo/letters') {
        listRequests += 1
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          items: [
            { content_id: '10000000-0000-4000-8000-000000000001', character: 'ກ', letter_type: 'consonant', letter_class: 'cons_middle', name: 'ko', romanization: 'k', sort_order: 1, content_status: 'active', working_revision_id: null, working_revision_status: null, lock_version: null, updated_at: '2026-09-05T01:00:00.000Z', available_actions: ['archive'] },
            { content_id: '10000000-0000-4000-8000-000000000002', character: 'ຂ', letter_type: 'consonant', letter_class: 'cons_high', name: 'kho', romanization: 'kh', sort_order: 2, content_status: 'active', working_revision_id: null, working_revision_status: null, lock_version: null, updated_at: '2026-09-05T01:01:00.000Z', available_actions: ['archive'] },
          ], page: 1, page_size: 50, total: 126, batch_actions: ['approve'],
        }) }); return true
      }
      return false
    })

    await page.goto('/content/lo/letters?q=%E0%BA%81&letter_type=consonant&content_status=active&page=1&page_size=50')
    await page.getByRole('checkbox', { name: '选择本页字母' }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByRole('status')).toContainText('已选择本页 2 项')
    await page.getByRole('button', { name: '选择当前查询全部 126 项' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status')).toContainText('已选择当前查询全部 126 项')
    await expect.poll(() => previewBody).toEqual({ query: {
      q: 'ກ', letter_type: ['consonant'], letter_class: [], content_status: ['active'], revision_status: [], sort: 'sort_order', order: 'asc',
    } })
    await page.getByRole('button', { name: '批量通过' }).click()
    await page.getByRole('button', { name: '确认通过' }).click()
    await expect(page.getByRole('region', { name: '批量任务详情' })).toContainText('已完成')
    await expect(page.getByRole('status')).toContainText('成功 126')
    await expect.poll(() => listRequests).toBeGreaterThanOrEqual(2)
  })

  test('TC-E2E-003：预览后集合变化会拒绝陈旧选择并要求重新选择', async ({ page }) => {
    let startRequests = 0
    await prepare(page, async (route, pathname) => {
      if (pathname === '/api/v1/admin/content/lo/letters/selection-preview') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          query: { letter_type: [], letter_class: [], content_status: [], revision_status: [], sort: 'sort_order', order: 'asc' },
          expected_count: 126,
          selection_hash: 'b'.repeat(64),
        }) }); return true
      }
      if (pathname === '/api/v1/admin/content/lo/letters/batch-tasks' && route.request().method() === 'POST') {
        startRequests += 1
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          code: 'BATCH_SELECTION_CHANGED',
          error: { message: '目标集合已变化，请重新选择' },
          request_id: 'stale-selection-test',
        }) }); return true
      }
      if (pathname === '/api/v1/admin/content/lo/letters') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          items: [{ content_id: '10000000-0000-4000-8000-000000000001', character: 'ກ', letter_type: 'consonant', letter_class: 'cons_middle', name: 'ko', romanization: 'k', sort_order: 1, content_status: 'active', working_revision_id: null, working_revision_status: null, lock_version: null, updated_at: '2026-09-05T01:00:00.000Z', available_actions: ['archive'] }],
          page: 1, page_size: 50, total: 126, batch_actions: ['archive'],
        }) }); return true
      }
      return false
    })

    await page.goto('/content/lo/letters')
    await page.getByRole('checkbox', { name: '选择本页字母' }).click()
    await page.getByRole('button', { name: '选择当前查询全部 126 项' }).click()
    await page.getByRole('button', { name: '批量归档' }).click()
    await page.getByLabel('操作原因').fill('清理过期内容')
    await page.getByRole('button', { name: '确认归档' }).click()
    await expect(page.getByRole('alert')).toContainText('目标集合已变化，请重新选择')
    await expect(page.getByRole('status')).toContainText('请重新选择')
    expect(startRequests).toBe(1)
  })

  test('TC-E2E-003：创建者观察混合结果、仅重试失败项且没有取消入口', async ({ page }) => {
    const batchTaskId = '20000000-0000-4000-8000-000000000099'
    let retryRequests = 0
    await prepare(page, async (route, pathname) => {
      if (pathname === '/api/v1/admin/content/lo/letters/batch-tasks' && route.request().method() === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          task_id: batchTaskId, action: 'archive', selection_mode: 'explicit_ids', status: 'queued', target_count: 3,
          processed_count: 0, succeeded_count: 0, failed_count: 0, skipped_count: 0, last_error_code: null,
          created_at: '2026-09-05T01:00:00.000Z', started_at: null, completed_at: null,
        }) }); return true
      }
      if (pathname === `/api/v1/admin/content/lo/letters/batch-tasks/${batchTaskId}/retry-failed`) {
        retryRequests += 1
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          task_id: batchTaskId, action: 'archive', selection_mode: 'explicit_ids', status: 'queued', target_count: 3,
          processed_count: 2, succeeded_count: 1, failed_count: 0, skipped_count: 1, last_error_code: null,
          created_at: '2026-09-05T01:00:00.000Z', started_at: null, completed_at: null,
        }) }); return true
      }
      if (pathname === `/api/v1/admin/content/lo/letters/batch-tasks/${batchTaskId}`) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          task: { task_id: batchTaskId, action: 'archive', selection_mode: 'explicit_ids', status: 'completed_with_issues', target_count: 3, processed_count: 3, succeeded_count: 1, failed_count: 1, skipped_count: 1, last_error_code: null, created_at: '2026-09-05T01:00:00.000Z', started_at: '2026-09-05T01:00:01.000Z', completed_at: '2026-09-05T01:00:03.000Z' },
          items: [
            { item_no: 1, content_id: '10000000-0000-4000-8000-000000000001', status: 'succeeded', retry_count: 0 },
            { item_no: 2, content_id: '10000000-0000-4000-8000-000000000002', status: 'failed', error_code: 'ILLEGAL_STATE_TRANSITION', error_message: '状态已变化', retry_count: 0 },
            { item_no: 3, content_id: '10000000-0000-4000-8000-000000000003', status: 'skipped', error_code: 'FORBIDDEN', error_message: '权限已撤销', retry_count: 0 },
          ], page: 1, page_size: 20, total: 3,
        }) }); return true
      }
      if (pathname === '/api/v1/admin/content/lo/letters/batch-tasks' && route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [{
          task_id: batchTaskId, action: 'archive', selection_mode: 'explicit_ids', status: 'completed_with_issues', target_count: 3,
          processed_count: 3, succeeded_count: 1, failed_count: 1, skipped_count: 1, last_error_code: null,
          created_at: '2026-09-05T01:00:00.000Z', started_at: '2026-09-05T01:00:01.000Z', completed_at: '2026-09-05T01:00:03.000Z',
        }], page: 1, page_size: 20, total: 1 }) }); return true
      }
      if (pathname === '/api/v1/admin/content/lo/letters') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({
          items: [
            { content_id: '10000000-0000-4000-8000-000000000001', character: 'ກ', letter_type: 'consonant', letter_class: 'cons_middle', name: 'ko', romanization: 'k', sort_order: 1, content_status: 'active', working_revision_id: null, working_revision_status: null, lock_version: null, updated_at: '2026-09-05T01:00:00.000Z', available_actions: ['archive'] },
            { content_id: '10000000-0000-4000-8000-000000000002', character: 'ຂ', letter_type: 'consonant', letter_class: 'cons_high', name: 'kho', romanization: 'kh', sort_order: 2, content_status: 'active', working_revision_id: null, working_revision_status: null, lock_version: null, updated_at: '2026-09-05T01:01:00.000Z', available_actions: ['archive'] },
            { content_id: '10000000-0000-4000-8000-000000000003', character: 'ຄ', letter_type: 'consonant', letter_class: 'cons_low', name: 'kho', romanization: 'kh', sort_order: 3, content_status: 'active', working_revision_id: null, working_revision_status: null, lock_version: null, updated_at: '2026-09-05T01:02:00.000Z', available_actions: ['archive'] },
          ], page: 1, page_size: 50, total: 3, batch_actions: ['archive'],
        }) }); return true
      }
      return false
    })

    await page.goto('/content/lo/letters')
    await page.getByRole('checkbox', { name: '选择本页字母' }).click()
    await page.getByRole('button', { name: '批量归档' }).click()
    await expect(page.getByRole('button', { name: '确认归档' })).toBeDisabled()
    await page.getByLabel('操作原因').fill('归档无效内容')
    await page.getByRole('button', { name: '确认归档' }).click()
    await expect(page.getByText(batchTaskId)).toBeVisible()
    await expect(page.getByRole('status')).toContainText('成功 1')
    await expect(page.getByRole('status')).toContainText('失败 1')
    await expect(page.getByRole('status')).toContainText('跳过 1')
    await expect(page.getByRole('button', { name: '仅重试失败项' })).toBeVisible()
    await expect(page.getByRole('button', { name: /取消任务/u })).toHaveCount(0)
    await page.getByRole('button', { name: '仅重试失败项' }).click()
    expect(retryRequests).toBe(1)
    await page.reload()
    await expect(page.getByRole('region', { name: '批量任务历史' })).toContainText('completed_with_issues')
    await page.getByRole('button', { name: '查看详情' }).click()
    await expect(page.getByRole('region', { name: '批量任务详情' })).toContainText(batchTaskId)
  })

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
