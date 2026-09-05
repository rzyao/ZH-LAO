import { expect, test, type Page } from '@playwright/test'

const courseId = '10000000-0000-4000-8000-000000000001'
const revisionId = '10000000-0000-4000-8000-000000000002'
const permissions = ['content.curriculum.read', 'content.curriculum.write', 'content.curriculum.publish']
const envelope = (data: unknown) => JSON.stringify({ code: 'OK', data, request_id: 'curriculum-e2e' })

async function prepare(page: Page) {
  await page.addInitScript((granted) => window.localStorage.setItem('zh-lao.admin.session', JSON.stringify({ accessToken: 'test', refreshToken: 'test', operator: { id: '10000000-0000-4000-8000-000000000099', name: '课程运营', roleId: 'content' }, permissions: granted })), permissions)
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const json = (data: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: envelope(data) })
    if (path === '/api/v1/admin/operations/me') return json({ operator: { operator_id: '10000000-0000-4000-8000-000000000099', display_name: '课程运营', status: 'active', roles: [], permissions } })
    if (path.startsWith('/api/v1/admin/platform/menus')) return json({ groups: [] })
    if (path === '/api/v1/admin/content/courses' && route.request().method() === 'GET') return json([])
    if (path === '/api/v1/admin/content/courses' && route.request().method() === 'POST') return json({ courseId, revisionId, lockVersion: 0 })
    if (path === `/api/v1/admin/content/courses/${courseId}`) return json({ id: courseId, learningLanguage: 'zh', title: '中文入门', status: 'draft', sortOrder: 0, publishedRevisionId: null, workingRevisionId: revisionId, workingRevisionStatus: 'draft', updatedAt: '2026-09-05T00:00:00.000Z', workingSnapshot: { title: '中文入门', sortOrder: 0, units: [{ title: '第一单元', sortOrder: 1, lessons: [] }] }, publishedLessons: [{ lessonId: '10000000-0000-4000-8000-000000000003', revisionId: '10000000-0000-4000-8000-000000000004', title: '已发布课节', unitSortOrder: 1, sortOrder: 1 }], revisions: [{ id: revisionId, number: 1, status: 'draft', lockVersion: 0, createdAt: '2026-09-05T00:00:00.000Z', reviewedAt: null, reviewRemark: null }] })
    if (path.startsWith('/api/v1/admin/content/')) return json({ items: [], total: 0 })
    return route.continue()
  })
}

test('运营人员可创建课程并只将已发布课节加入工作版本', async ({ page }) => {
  await prepare(page)
  await page.goto('/content/courses')
  await page.getByRole('button', { name: '创建课程' }).click()
  await page.getByLabel('课程名称').fill('中文入门')
  await page.getByRole('button', { name: '创建草稿' }).click()
  await expect(page).toHaveURL(new RegExp(`/content/courses/${courseId}$`))
  await expect(page.getByRole('heading', { name: '中文入门' })).toBeVisible()
  await expect(page.getByText('Unit 1 · 已发布课节', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '加入课程' }).click()
  await expect(page.getByRole('button', { name: '已加入' })).toBeDisabled()
})
