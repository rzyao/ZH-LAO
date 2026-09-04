import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LayoutDashboard } from 'lucide-react'
import { Sidebar } from './sidebar'

let pathname = '/'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => <a href={to} {...rest}>{children}</a>,
  useRouterState: (options?: { select?: (state: unknown) => unknown }) => {
    const state = { location: { pathname } }
    return options?.select ? options.select(state) : state
  },
}))
vi.mock('@/navigation/use-nav-config', () => ({ useNavConfig: vi.fn() }))
vi.mock('@/auth/context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/app/config', () => ({ env: { enableDesignSystem: false } }))

import { useNavConfig } from '@/navigation/use-nav-config'
import { useAuth } from '@/auth/context/AuthContext'

const mockedUseNavConfig = vi.mocked(useNavConfig)
const mockedUseAuth = vi.mocked(useAuth)

describe('Sidebar', () => {
  beforeEach(() => {
    pathname = '/'
  })

  it('渲染配置驱动的根目录节点', () => {
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseNavConfig.mockReturnValue({
      nav: [{ key: 'overview', label: '总览看板', href: '/', icon: LayoutDashboard, children: [] }],
      source: 'remote',
    })
    render(<Sidebar />)
    expect(screen.getByText('总览看板')).toBeTruthy()
  })

  it('远端菜单正常时不显示恢复入口', () => {
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseNavConfig.mockReturnValue({ nav: [], source: 'remote' })
    render(<Sidebar />)
    expect(screen.queryByText('菜单管理')).toBeNull()
  })

  it('回退导航为有权限用户保留菜单管理入口（FR-012）', () => {
    mockedUseAuth.mockReturnValue({ can: (permission: string) => permission === 'platform.menus.read' } as never)
    mockedUseNavConfig.mockReturnValue({
      nav: [{ key: 'overview', label: '总览看板', href: '/', icon: LayoutDashboard, children: [] }],
      source: 'fallback',
    })
    render(<Sidebar />)
    expect(screen.getByText('菜单管理')).toBeTruthy()
  })

  it('目录即使包含当前页面也默认收起（CR-002）', () => {
    pathname = '/platform/menus'
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseNavConfig.mockReturnValue({
      nav: [{ key: 'system', label: '系统运维', icon: LayoutDashboard, children: [
        { key: 'menus', label: '菜单管理', href: '/platform/menus', icon: LayoutDashboard, children: [] },
      ] }],
      source: 'remote',
    })
    render(<Sidebar />)
    const trigger = screen.getByRole('button', { name: '系统运维' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('菜单管理')).toBeNull()
    fireEvent.click(trigger)
    expect(screen.getByRole('link', { name: '菜单管理' })).toBeTruthy()
  })

  it('点击带路由的二级菜单项目也会伸缩，箭头仍可独立操作（CR-005）', () => {
    pathname = '/content/lo/letters'
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseNavConfig.mockReturnValue({
      nav: [{ key: 'learning-content', label: '学习与内容', icon: LayoutDashboard, children: [
        { key: 'content', label: '内容管理', href: '/content', icon: LayoutDashboard, children: [
          { key: 'zh', label: '中文内容', icon: LayoutDashboard, children: [
            { key: 'pinyin', label: '拼音管理', href: '/content/zh/pinyin', icon: LayoutDashboard, children: [] },
          ] },
          { key: 'lo', label: '老挝语内容', icon: LayoutDashboard, children: [
            { key: 'letters', label: '字母管理', href: '/content/lo/letters', icon: LayoutDashboard, children: [] },
          ] },
        ] },
      ] }],
      source: 'remote',
    })
    render(<Sidebar />)

    fireEvent.click(screen.getByRole('button', { name: '学习与内容' }))
    const contentEntry = screen.getByRole('link', { name: '内容管理' })
    const contentArrow = screen.getByRole('button', { name: '展开 内容管理' })
    expect(contentEntry).toHaveAttribute('href', '/content')
    expect(contentEntry).toHaveAttribute('aria-expanded', 'false')
    expect(contentEntry.parentElement).toBe(contentArrow.parentElement)
    expect(contentEntry.parentElement).toHaveClass('bg-sidebar-accent')
    fireEvent.click(contentEntry)
    expect(contentEntry).toHaveAttribute('aria-expanded', 'true')

    const chinese = screen.getByRole('button', { name: '中文内容' })
    const lao = screen.getByRole('button', { name: '老挝语内容' })
    expect(chinese).toHaveClass('text-sm')
    expect(lao).toHaveClass('text-sm')

    fireEvent.click(chinese)
    expect(screen.getByRole('link', { name: '拼音管理' })).toHaveAttribute('href', '/content/zh/pinyin')
    fireEvent.click(lao)
    expect(screen.getByRole('link', { name: '字母管理' })).toHaveAttribute('href', '/content/lo/letters')

    fireEvent.click(screen.getByRole('button', { name: '收起 内容管理' }))
    expect(contentEntry).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: '中文内容' })).toBeNull()
  })
})
