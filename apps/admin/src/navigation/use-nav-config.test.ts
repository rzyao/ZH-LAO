import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNavConfig } from './use-nav-config'
import type { MenuTreeNode } from './types'

vi.mock('@/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/features/platform/menus-queries', () => ({
  useMenusQuery: vi.fn(),
}))

import { useAuth } from '@/auth/context/AuthContext'
import { useMenusQuery } from '@/features/platform/menus-queries'

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseMenusQuery = vi.mocked(useMenusQuery)

function treeNode(partial: Partial<MenuTreeNode>): MenuTreeNode {
  return {
    id: 1,
    label: 'node',
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

describe('useNavConfig', () => {
  it('falls back to NAV_GROUPS when fetch errors (FR-009)', async () => {
    mockedUseAuth.mockReturnValue({ can: () => true } as never)
    mockedUseMenusQuery.mockReturnValue({ isError: true, data: undefined } as never)

    const { result } = renderHook(() => useNavConfig())
    await waitFor(() => {
      expect(result.current.source).toBe('fallback')
    })
  })

  it('filters items by OR semantics: any permission match keeps the item (FR-007)', async () => {
    const can = (p: string) => p === 'operations.roles.read'
    mockedUseAuth.mockReturnValue({ can } as never)
    mockedUseMenusQuery.mockReturnValue({
      isError: false,
      data: [
        treeNode({
          id: 1,
          label: '运营权限',
          routeKey: 'operations',
          children: [
            treeNode({
              id: 2,
              label: '操作员管理',
              routeKey: 'operations.operators',
              permissions: ['operations.operators.read', 'operations.roles.read'],
            }),
            treeNode({
              id: 3,
              label: '角色与权限',
              routeKey: 'operations.roles',
              permissions: ['operations.roles.read'],
            }),
            treeNode({
              id: 4,
              label: '无权限项',
              routeKey: 'operations.audit_logs',
              permissions: ['operations.audit_logs.read'],
            }),
          ],
        }),
      ],
    } as never)

    const { result } = renderHook(() => useNavConfig())
    await waitFor(() => {
      expect(result.current.source).toBe('remote')
    })

    // OR: 拥有 roles.read 的项(操作员管理、角色与权限)保留;无权限项(审计)隐藏
    const items = result.current.nav[0]!.items
    expect(items.map((i) => i.label)).toEqual(['操作员管理', '角色与权限'])
  })

  it('keeps items with empty permission list visible to all authenticated users', async () => {
    mockedUseAuth.mockReturnValue({ can: () => false } as never)
    mockedUseMenusQuery.mockReturnValue({
      isError: false,
      data: [
        treeNode({
          id: 1,
          label: '总览',
          routeKey: 'overview',
          children: [
            treeNode({ id: 2, label: '总览看板', routeKey: 'overview', permissions: [] }),
          ],
        }),
      ],
    } as never)

    const { result } = renderHook(() => useNavConfig())
    await waitFor(() => {
      expect(result.current.source).toBe('remote')
    })
    expect(result.current.nav[0]!.items.map((i) => i.label)).toEqual(['总览看板'])
  })
})
