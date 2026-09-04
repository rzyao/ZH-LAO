import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNavConfig } from './use-nav-config'
import type { MenuTreeNode, NavItem } from './types'

vi.mock('@/auth/context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/platform/menus-queries', () => ({ useMenusQuery: vi.fn() }))

import { useAuth } from '@/auth/context/AuthContext'
import { useMenusQuery } from '@/features/platform/menus-queries'

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseMenusQuery = vi.mocked(useMenusQuery)

function treeNode(partial: Partial<MenuTreeNode>): MenuTreeNode {
  return {
    id: 1,
    label: '节点',
    routeKey: 'overview',
    icon: null,
    sortOrder: 0,
    status: 'active',
    updatedAt: '2026-01-01T00:00:00Z',
    permissions: [],
    children: [],
    ...partial,
  }
}

function find(items: readonly NavItem[], label: string): NavItem | undefined {
  for (const item of items) {
    if (item.label === label) return item
    const nested = find(item.children ?? [], label)
    if (nested) return nested
  }
  return undefined
}

describe('useNavConfig', () => {
  it('菜单读取失败时回退安全默认目录树（FR-009）', async () => {
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseMenusQuery.mockReturnValue({ isError: true, data: undefined } as never)
    const { result } = renderHook(() => useNavConfig())
    await waitFor(() => expect(result.current.source).toBe('fallback'))
    expect(find(result.current.nav, '中文内容')).toBeDefined()
  })

  it('按多权限 OR 语义过滤任意层级节点（FR-007）', async () => {
    mockedUseAuth.mockReturnValue({ can: (permission: string) => permission === 'operations.roles.read' } as never)
    mockedUseMenusQuery.mockReturnValue({
      isError: false,
      data: [treeNode({
        label: '系统运维', routeKey: null, children: [
          treeNode({ id: 2, label: '操作员管理', routeKey: 'operations.operators', permissions: ['operations.operators.read', 'operations.roles.read'] }),
          treeNode({ id: 3, label: '角色与权限', routeKey: 'operations.roles', permissions: ['operations.roles.read'] }),
          treeNode({ id: 4, label: '无权限项', routeKey: 'operations.audit_logs', permissions: ['operations.audit_logs.read'] }),
        ],
      })],
    } as never)

    const { result } = renderHook(() => useNavConfig())
    await waitFor(() => expect(result.current.source).toBe('remote'))
    expect(result.current.nav[0]?.children?.map((item) => item.label)).toEqual(['操作员管理', '角色与权限'])
  })

  it('空权限列表的节点对已认证用户可见', async () => {
    mockedUseAuth.mockReturnValue({ can: () => false } as never)
    mockedUseMenusQuery.mockReturnValue({
      isError: false,
      data: [treeNode({ label: '总览看板', routeKey: 'overview', permissions: [] })],
    } as never)
    const { result } = renderHook(() => useNavConfig())
    await waitFor(() => expect(result.current.source).toBe('remote'))
    expect(result.current.nav.map((item) => item.label)).toEqual(['总览看板'])
  })

  it('保留任意深度目录并过滤已停用节点', async () => {
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseMenusQuery.mockReturnValue({
      isError: false,
      data: [treeNode({
        label: '学习与内容', routeKey: null, children: [treeNode({
          id: 2, label: '内容管理', routeKey: 'content', children: [treeNode({
            id: 3, label: '老挝语内容', routeKey: null, children: [treeNode({
              id: 4, label: '文字基础', routeKey: null, children: [
                treeNode({ id: 5, label: '字母管理', routeKey: 'content.lo.letters' }),
                treeNode({ id: 6, label: '旧字母管理', routeKey: 'content.lo.letters', status: 'disabled' }),
              ],
            })],
          })],
        })],
      })],
    } as never)

    const { result } = renderHook(() => useNavConfig())
    await waitFor(() => expect(result.current.source).toBe('remote'))
    expect(find(result.current.nav, '字母管理')?.href).toBe('/content/lo/letters')
    expect(find(result.current.nav, '旧字母管理')).toBeUndefined()
    expect(find(result.current.nav, '文字基础')?.children).toHaveLength(1)
  })
})
