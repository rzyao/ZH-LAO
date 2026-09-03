import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from './sidebar'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
  useRouterState: (opts?: { select?: (state: unknown) => unknown }) => {
    const state = { location: { pathname: '/' } }
    return opts?.select ? opts.select(state) : state
  },
}))

vi.mock('@/navigation/use-nav-config', () => ({
  useNavConfig: vi.fn(),
}))

vi.mock('@/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/app/config', () => ({ env: { enableDesignSystem: false } }))

import { useNavConfig } from '@/navigation/use-nav-config'
import { useAuth } from '@/auth/context/AuthContext'

const mockedUseNavConfig = vi.mocked(useNavConfig)
const mockedUseAuth = vi.mocked(useAuth)

describe('Sidebar', () => {
  it('renders config-driven nav groups', () => {
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseNavConfig.mockReturnValue({
      nav: [
        { key: 'g1', label: '总览', items: [{ key: 'overview', label: '总览看板', href: '/', icon: () => null }] },
      ],
      secondary: [],
      source: 'remote',
    })

    render(<Sidebar />)
    expect(screen.getByText('总览')).toBeTruthy()
    expect(screen.getByText('总览看板')).toBeTruthy()
  })

  it('does not render minimal menu entry when nav source is remote', () => {
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseNavConfig.mockReturnValue({
      nav: [{ key: 'g1', label: '总览', items: [] }],
      secondary: [],
      source: 'remote',
    })

    render(<Sidebar />)
    expect(screen.queryByText('菜单管理')).toBeNull()
  })

  it('renders minimal menu entry on empty fallback for users with menus.read (FR-012)', () => {
    mockedUseAuth.mockReturnValue({ can: (p: string) => p === 'platform.menus.read' } as never)
    mockedUseNavConfig.mockReturnValue({
      nav: [
        { key: 'overview', label: '总览', items: [{ key: 'overview', label: '总览看板', href: '/', icon: () => null }] },
        { key: 'system', label: '系统运维', items: [{ key: 'platform', label: '平台控制台', href: '/platform', icon: () => null }] },
      ],
      secondary: [],
      source: 'fallback',
    })

    render(<Sidebar />)
    expect(screen.getByText('菜单管理')).toBeTruthy()
  })
})
