import { expect, test } from '@playwright/test'

test.describe('Admin Foundation smoke', () => {
  test('admin opens and shows the app shell', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('sidebar')).toBeVisible()
    await expect(page.getByTestId('header')).toBeVisible()
    await expect(page.getByTestId('main-content')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'ZH-LAO Admin' })).toBeVisible()
  })

  test('all 11 domain entries are present in the sidebar', async ({ page }) => {
    await page.goto('/')
    const labels = [
      'Content',
      'Learning',
      'Audio Production',
      'Identity',
      'Social',
      'Chat',
      'Commerce',
      'Rewards',
      'Trust & Safety',
      'Operations',
      'Platform',
    ]
    for (const label of labels) {
      await expect(page.getByRole('link', { name: label })).toBeVisible()
    }
  })

  test('navigation works to a domain placeholder', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Content' }).click()
    await expect(page.getByText('Content — Coming Soon')).toBeVisible()
    await expect(page).toHaveURL(/\/content$/)
  })

  test('navigation works for the design-system page', async ({ page }) => {
    await page.goto('/system/design-system')
    await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible()
    await expect(page.getByText('示例记录 1')).toBeVisible()
  })

  test('404 works for unknown routes', async ({ page }) => {
    await page.goto('/definitely-missing')
    await expect(page.getByText('页面不存在')).toBeVisible()
  })

  test('theme switch works (light -> dark -> light)', async ({ page }) => {
    await page.goto('/')
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
