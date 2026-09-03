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
    const labels = [
      '内容管理', '学习系统', '音频生产', '身份认证', '社交关系', '实时聊天',
      '交易商城', '奖励中心', '信任与风控', '运营权限', '平台控制台',
    ]
    for (const label of labels) {
      await expect(page.getByRole('link', { name: label })).toBeVisible()
    }
  })

  test('navigation works to a domain placeholder', async ({ page }) => {
    await login(page)
    await page.getByRole('link', { name: '内容管理' }).click()
    await expect(page.getByText('内容管理 — 即将上线')).toBeVisible()
    await expect(page).toHaveURL(/\/content$/)
  })

  test('Platform entry opens the real Stage A management landing', async ({ page }) => {
    await login(page)
    await page.goto('/platform')
    await expect(page.getByRole('heading', { name: '平台控制台' })).toBeVisible()
    await expect(page.getByText('平台控制台 Stage A')).toBeVisible()
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
