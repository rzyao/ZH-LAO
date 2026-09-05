import { expect, test, type Page } from '@playwright/test'

test.describe('Admin Foundation smoke', () => {
  async function login(page: Page) {
    await page.addInitScript(() => {
      window.localStorage.setItem('zh-lao.admin.session', JSON.stringify({
        accessToken: 'e2e-access-token',
        refreshToken: 'e2e-refresh-token',
        operator: { id: '00000000-0000-4000-8000-000000000001', name: 'admin', roleId: 'super_admin' },
        permissions: ['*.*.*'],
      }))
    })
    await page.route('**/api/v1/admin/platform/menus**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'OK', data: { groups: [] }, request_id: '冒烟测试菜单' }),
    }))
    await page.route('**/api/v1/admin/operations/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'OK',
        data: {
          operator: {
            operator_id: '00000000-0000-4000-8000-000000000001',
            display_name: 'admin',
            status: 'active',
            roles: [{ role_id: '00000000-0000-4000-8000-000000000002', code: 'super_admin', name: '超级管理员' }],
            permissions: ['*.*.*'],
          },
        },
        request_id: '冒烟测试权限刷新',
      }),
    }))
    await page.goto('/')
  }

  test('admin opens and shows the app shell', async ({ page }) => {
    await login(page)
    await expect(page.getByTestId('sidebar')).toBeVisible()
    await expect(page.getByTestId('header')).toBeVisible()
    await expect(page.getByTestId('main-content')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'ZH-LAO Admin' })).toBeVisible()
  })

  test('all 11 domain entries are present in the sidebar', async ({ page }) => {
    await login(page)
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar.getByRole('button', { name: '内容管理', exact: true })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '学习系统', exact: true })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '音频生产', exact: true })).toBeVisible()
    const directories = [
      ['用户与社交', [['link', '身份认证'], ['link', '社交关系'], ['link', '实时聊天']]],
      ['商业与财务', [['link', '交易商城'], ['link', '奖励中心']]],
      ['安全治理', [['link', '信任与风控']]],
      ['系统运维', [['link', '运营权限'], ['link', '平台控制台']]],
    ]
    for (const [directory, entries] of directories) {
      await sidebar.getByRole('button', { name: directory as string, exact: true }).click()
      for (const [role, label] of entries as Array<["button" | "link", string]>) {
        await expect(sidebar.getByRole(role, { name: label, exact: true })).toBeVisible()
      }
    }
  })

  test('内容管理入口展开中老两种语言的类别导航', async ({ page }) => {
    await login(page)
    const contentEntry = page.getByRole('button', { name: '内容管理', exact: true })
    await expect(contentEntry).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByText('中文内容', { exact: true })).not.toBeVisible()
    await contentEntry.click()
    await expect(contentEntry).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('button', { name: '收起 内容管理', exact: true }).click()
    await expect(contentEntry).toHaveAttribute('aria-expanded', 'false')
    await contentEntry.click()
    await expect(contentEntry).toHaveAttribute('aria-expanded', 'true')
    const chineseEntry = page.getByRole('button', { name: '中文内容', exact: true })
    const laoEntry = page.getByRole('button', { name: '老挝语内容', exact: true })
    await expect(chineseEntry).toBeVisible()
    await expect(laoEntry).toBeVisible()
    await laoEntry.click()
    const letters = page.getByRole('link', { name: '字母管理', exact: true })
    await expect(letters).toBeVisible()
    await letters.click()
    await expect(page).toHaveURL(/\/content\/lo\/letters$/)
  })

  test('navigation works to a domain placeholder', async ({ page }) => {
    await login(page)
    await page.getByRole('link', { name: '学习系统' }).click()
    await expect(page.getByText('学习系统 — 即将上线')).toBeVisible()
    await expect(page).toHaveURL(/\/learning$/)
  })

  test('Platform entry opens the real Stage A management landing', async ({ page }) => {
    await login(page)
    await page.goto('/platform')
    await expect(page.getByRole('heading', { name: '平台控制台' })).toBeVisible()
    await expect(page.getByText('平台控制台 Stage A')).toBeVisible()
    await page.getByRole('button', { name: '系统运维', exact: true }).click()
    await page.getByRole('button', { name: '展开 平台控制台', exact: true }).click()
    await expect(page.getByRole('link', { name: /功能开关/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /运行时配置/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /客户端版本/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /全服与定向公告/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /支持地区/ })).toBeVisible()
  })

  test('navigation works for the design-system page', async ({ page }) => {
    await login(page)
    await page.goto('/system/design-system')
    await expect(page.getByRole('heading', { name: '设计系统与组件规范' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '示例记录 1', exact: true })).toBeVisible()
  })

  test('menu management page opens (ADR-022)', async ({ page }) => {
    await login(page)
    await page.goto('/platform/menus')
    await expect(page.getByRole('heading', { name: '菜单与路由管理' })).toBeVisible()
  })

  test('404 works for unknown routes', async ({ page }) => {
    await login(page)
    await page.goto('/definitely-missing')
    await expect(page.getByText('页面不存在')).toBeVisible()
  })

  test('theme switch works (light -> dark -> light)', async ({ page }) => {
    await login(page)
    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)
    await page.getByTestId('theme-switch').click()
    await page.getByRole('menuitem', { name: '深色' }).click()
    await expect(html).toHaveClass(/dark/)
    await page.getByTestId('theme-switch').click()
    await page.getByRole('menuitem', { name: '浅色' }).click()
    await expect(html).not.toHaveClass(/dark/)
  })
})
