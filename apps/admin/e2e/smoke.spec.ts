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
    const sidebar = page.getByTestId('sidebar')
    const labels = [
      '内容管理', '学习系统', '音频生产', '身份认证', '社交关系', '实时聊天',
      '交易商城', '奖励中心', '信任与风控', '运营权限', '平台控制台',
    ]
    // ADR-022 配置驱动导航:带子级的一级项(内容管理/运营权限/平台控制台)以可展开按钮呈现,
    // 其余一级项以链接呈现;全部 11 个域入口都必须可见。
    for (const label of labels) {
      const entry = sidebar
        .getByRole('link', { name: label, exact: true })
        .or(sidebar.getByRole('button', { name: label, exact: true }))
      await expect(entry).toBeVisible()
    }
  })

  test('内容管理 entry expands to the content modules', async ({ page }) => {
    await login(page)
    const contentEntry = page.getByRole('button', { name: '内容管理', exact: true })
    await contentEntry.click()
    const letters = page.getByRole('link', { name: '字母管理', exact: true })
    await expect(letters).toBeVisible()
    await letters.click()
    await expect(page).toHaveURL(/\/content\/letters$/)
    await expect(page.getByRole('heading', { name: /老挝语字母管理/ })).toBeVisible()
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
