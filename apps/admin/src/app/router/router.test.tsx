import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  return { ...render(<RouterProvider router={testRouter} />), router: testRouter }
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

  it('严格解析 Lao-letter URL search 并在刷新入口恢复控件状态', async () => {
    const view = renderAt('/content/lo/letters?q=%E0%BA%81&letter_type=vowel,consonant&letter_class=cons_middle&content_status=active&revision_status=none&sort=name&order=desc&page=4&page_size=100')
    expect(await screen.findByTestId('content-lo-letters-page')).toBeInTheDocument()

    await waitFor(() => expect(view.router.state.location.search).toEqual({
      q: 'ກ',
      letter_type: ['consonant', 'vowel'],
      letter_class: ['cons_middle'],
      content_status: ['active'],
      revision_status: ['none'],
      sort: 'name',
      order: 'desc',
      page: 4,
      page_size: 100,
    }))
    expect(screen.getByRole('textbox', { name: '搜索字母' })).toHaveValue('ກ')
    expect(screen.getByRole('combobox', { name: '字母类型' })).toHaveTextContent(/辅音.*元音|元音.*辅音/u)
    expect(screen.getByRole('combobox', { name: '每页条数' })).toHaveTextContent('100')
  })

  it('搜索范围变化使用 URL 导航并把页码重置为第一页', async () => {
    const view = renderAt('/content/lo/letters?q=%E0%BA%81&page=4&page_size=50')
    const search = await screen.findByRole('textbox', { name: '搜索字母' })
    fireEvent.change(search, { target: { value: 'ຂ' } })

    await waitFor(() => {
      expect(view.router.state.location.pathname).toBe('/content/lo/letters')
      expect(view.router.state.location.search).toMatchObject({ q: 'ຂ', page: 1, page_size: 50 })
    }, { timeout: 1_000 })
  })

  it('筛选、排序和页大小立即写回 URL 并重置页码', async () => {
    const view = renderAt('/content/lo/letters?page=4&page_size=50')
    await screen.findByTestId('content-lo-letters-page')

    fireEvent.change(screen.getByRole('combobox', { name: '字母类型' }), { target: { value: 'vowel' } })
    await waitFor(() => expect(view.router.state.location.search).toMatchObject({
      letter_type: ['vowel'], page: 1, page_size: 50,
    }))

    fireEvent.change(screen.getByRole('combobox', { name: '排序字段' }), { target: { value: 'name' } })
    await waitFor(() => expect(view.router.state.location.search).toMatchObject({ sort: 'name', page: 1 }))

    fireEvent.change(screen.getByRole('combobox', { name: '每页条数' }), { target: { value: '100' } })
    await waitFor(() => expect(view.router.state.location.search).toMatchObject({ page: 1, page_size: 100 }))
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
