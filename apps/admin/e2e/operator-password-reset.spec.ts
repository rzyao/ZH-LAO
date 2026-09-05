import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const actorId = '00000000-0000-4000-8000-000000000001'
const targetId = '00000000-0000-4000-8000-000000000002'

function envelope(data: unknown) {
  return JSON.stringify({ code: 'OK', data, request_id: 'operator-password-reset-e2e' })
}

test('JRN-001：确认重置后仅在结果对话框显示一次性密码，且 WCAG-AA 无违规', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('zh-lao.admin.session', JSON.stringify({
      accessToken: 'operator-reset-test-token', refreshToken: 'operator-reset-refresh-token',
      operator: { id: '00000000-0000-4000-8000-000000000001', name: '测试管理员', roleId: 'super_admin' },
      permissions: ['operations.operators.read', 'operations.operators.reset_password'],
    }))
  })
  await page.route('**/*', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/api/v1/admin/operations/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ operator: { operator_id: actorId, display_name: '测试管理员', status: 'active', roles: [], permissions: ['operations.operators.read', 'operations.operators.reset_password'] } }) }); return
    }
    if (pathname === '/api/v1/admin/operations/operators' && route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [{ operator_id: targetId, auth_subject_id: '00000000-0000-4000-8000-000000000003', display_name: '待重置操作员', status: 'active', created_at: '2026-09-05T00:00:00.000Z', updated_at: '2026-09-05T00:00:00.000Z' }], page: 1, page_size: 100, total: 1 }) }); return
    }
    if (pathname === '/api/v1/admin/operations/roles') { await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [], page: 1, page_size: 100, total: 0 }) }); return }
    if (pathname === `/api/v1/admin/operations/operators/${targetId}/password-reset`) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: envelope({ operator: { operator_id: targetId, auth_subject_id: '00000000-0000-4000-8000-000000000003', display_name: '待重置操作员', status: 'active', created_at: '2026-09-05T00:00:00.000Z', updated_at: '2026-09-05T00:00:00.000Z' }, temporary_password: 'E2eOneTimePassword9' }) }); return
    }
    if (pathname.startsWith('/api/')) { await route.fulfill({ status: 200, contentType: 'application/json', body: envelope({ items: [], total: 0 }) }); return }
    await route.continue()
  })

  await page.goto('/operations/operators')
  await page.getByRole('button', { name: '重置密码' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('全部后台会话将立即失效')
  await page.getByRole('button', { name: '确认重置' }).click()
  const result = page.getByRole('dialog')
  await expect(result).toContainText('一次性临时密码')
  await expect(result).toContainText('E2eOneTimePassword9')
  const axe = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(axe.violations).toEqual([])
  await page.getByRole('button', { name: '我已安全保存' }).click()
  await expect(page.getByText('E2eOneTimePassword9')).toHaveCount(0)
})
