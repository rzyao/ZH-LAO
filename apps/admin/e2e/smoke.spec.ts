import { expect, test } from '@playwright/test'

test.describe('Admin Foundation smoke', () => {
  async function login(page: import('@playwright/test').Page) {
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
      'Content', 'Learning', 'Audio Production', 'Identity', 'Social', 'Chat',
      'Commerce', 'Rewards', 'Trust & Safety', 'Operations', 'Platform',
    ]
    for (const label of labels) {
      await expect(page.getByRole('link', { name: label })).toBeVisible()
    }
  })

  test('navigation works to a domain placeholder', async ({ page }) => {
    await login(page)
    await page.getByRole('link', { name: 'Content' }).click()
    await expect(page.getByText('Content — Coming Soon')).toBeVisible()
    await expect(page).toHaveURL(/\/content$/)
  })

  test('Platform entry opens the real Stage A management landing', async ({ page }) => {
    await login(page)
    await page.goto('/platform')
    await expect(page.getByRole('heading', { name: 'Platform' })).toBeVisible()
    await expect(page.getByText('Platform Admin Stage A')).toBeVisible()
    await expect(page.getByRole('link', { name: /Feature Flags/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Runtime Configs/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /App Versions/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Announcements/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Regions/ })).toBeVisible()
  })

  test('navigation works for the design-system page', async ({ page }) => {
    await login(page)
    await page.goto('/system/design-system')
    await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '示例记录 1', exact: true })).toBeVisible()
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
