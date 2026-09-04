import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { routeTree } from './router'

vi.mock('@/api/client', async (importOriginal) => {
  const actual = (await importOriginal()) as {
    apiClient: { get: (...args: unknown[]) => unknown }
  }
  return {
    ...actual,
    apiClient: Object.assign(actual.apiClient, {
      get: vi.fn().mockResolvedValue({
        data: { status: 'ok' },
        status: 200,
        requestId: 'req-1',
      }),
    }),
  }
})

beforeEach(() => {
  window.localStorage.clear()
})

function renderAt(initialEntry: string, authenticated = true) {
  if (authenticated) {
    window.localStorage.setItem('zh-lao.admin.session', JSON.stringify({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      operator: { id: '00000000-0000-4000-8000-000000000001', name: 'admin', roleId: 'super_admin' },
      permissions: ['*.*.*'],
    }))
  }
  const testRouter = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  return render(<RouterProvider router={testRouter} />)
}

describe('Router', () => {
  it('renders the app shell and the overview page', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'ZH-LAO Admin' })).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
  })

  it('renders a Domain placeholder route', async () => {
    renderAt('/learning')
    expect(await screen.findByText('学习系统 — 即将上线')).toBeInTheDocument()
  })

  it('renders the real Platform Admin landing route', async () => {
    renderAt('/platform')
    expect(await screen.findByRole('heading', { name: '平台控制台' })).toBeInTheDocument()
    expect(screen.getByText('平台控制台 Stage A')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '系统运维' }))
    fireEvent.click(screen.getByRole('button', { name: '展开 平台控制台' }))
    expect(screen.getByRole('link', { name: /功能开关/ })).toBeInTheDocument()
  })

  it('显示相互独立的中文和老挝语内容类别路由', async () => {
    const chinese = renderAt('/content/zh/pinyin')
    expect(await screen.findByTestId('content-zh-pinyin-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '拼音管理' })).toBeInTheDocument()
    chinese.unmount()

    renderAt('/content/lo/syllables')
    expect(await screen.findByTestId('content-lo-syllables-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '音节管理' })).toBeInTheDocument()
  })

  it('老挝语字母语言路由使用统一版本管理页面', async () => {
    renderAt('/content/lo/letters')
    expect(await screen.findByTestId('content-lo-letters-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '字母管理' })).toBeInTheDocument()
  })

  it('renders the 404 page for unknown routes', async () => {
    renderAt('/definitely-missing')
    expect(await screen.findByText('页面不存在')).toBeInTheDocument()
  })

  it('renders the login route with empty (non-leaking) default fields', async () => {
    renderAt('/login', false)
    expect(await screen.findByRole('heading', { name: 'ZH-LAO Admin' })).toBeInTheDocument()
    // FR-004: the account field must NOT pre-fill a known account name.
    expect(screen.getByLabelText('账号')).toHaveValue('')
    expect(screen.getByLabelText('密码')).toHaveAttribute('type', 'password')
  })

  it('redirects an anonymous visitor from a protected page to login', async () => {
    renderAt('/content/letters', false)
    expect(await screen.findByLabelText('账号')).toBeInTheDocument()
    expect(screen.queryByText('老挝语字母管理 (Lao Alphabet)')).not.toBeInTheDocument()
  })
})
