import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

function renderAt(initialEntry: string) {
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
    renderAt('/content')
    expect(await screen.findByText('Content — Coming Soon')).toBeInTheDocument()
  })

  it('renders the real Platform Admin landing route', async () => {
    renderAt('/platform')
    expect(await screen.findByRole('heading', { name: 'Platform' })).toBeInTheDocument()
    expect(screen.getByText('Platform Admin Stage A')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Feature Flags/ })).toBeInTheDocument()
  })

  it('renders the 404 page for unknown routes', async () => {
    renderAt('/definitely-missing')
    expect(await screen.findByText('页面不存在')).toBeInTheDocument()
  })

  it('renders the login placeholder route', async () => {
    renderAt('/login')
    expect(await screen.findByText(/登录功能将在/)).toBeInTheDocument()
  })
})
