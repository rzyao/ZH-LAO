import { apiClient } from '@/api/client'
import type { MenusResponse, MenuTreeNode } from '@/navigation/types'

const base = '/api/v1/admin/platform'

export interface MenuCreateInput {
  parent_id?: number | null
  label: string
  route_key?: string | null
  icon?: string | null
  sort_order?: number
  permissions?: readonly string[]
}

export interface MenuUpdateInput {
  label?: string
  route_key?: string | null
  icon?: string | null
  sort_order?: number
  status?: 'active' | 'disabled'
  permissions?: readonly string[]
  expected_updated_at?: string
}

export interface MenuMoveInput {
  parent_id: number | null
  position: number
  expected_updated_at: string
  source_layer_updated_at: string
  target_layer_updated_at: string
}

/**
 * 后端菜单树 DTO 使用 snake_case(route_key/sort_order/updated_at),
 * 前端 MenuTreeNode 使用 camelCase(routeKey/sortOrder/updatedAt)。
 * 此处做字段映射,否则 normalizeToNav 读不到 routeKey,二级菜单全部失效。
 */
function toMenuTreeNode(raw: Record<string, unknown>): MenuTreeNode {
  return {
    id: Number(raw.id),
    label: String(raw.label),
    routeKey: (raw.route_key as string | null) ?? null,
    icon: (raw.icon as string | null) ?? null,
    sortOrder: Number(raw.sort_order ?? 0),
    status: (raw.status as MenuTreeNode['status']) ?? 'active',
    updatedAt: String(raw.updated_at ?? ''),
    permissions: Array.isArray(raw.permissions) ? (raw.permissions as readonly string[]) : [],
    children: Array.isArray(raw.children) ? raw.children.map((c) => toMenuTreeNode(c as Record<string, unknown>)) : [],
  }
}

export const menusApi = {
  async listMenus(signal?: AbortSignal): Promise<MenuTreeNode[]> {
    const response = await apiClient.get<MenusResponse>(`${base}/menus`, { signal })
    return response.data.groups.map((g) => toMenuTreeNode(g as unknown as Record<string, unknown>))
  },

  async createMenu(input: MenuCreateInput) {
    const response = await apiClient.post(`${base}/menus`, {
      json: {
        ...input,
        parent_id: input.parent_id ?? null,
        route_key: input.route_key ?? null,
        icon: input.icon ?? null,
      },
    })
    return response.data
  },

  async updateMenu(id: number, input: MenuUpdateInput) {
    const response = await apiClient.patch(`${base}/menus/${id}`, {
      json: input,
    })
    return response.data
  },

  async removeMenu(id: number, expected_updated_at?: string) {
    const response = await apiClient.post(`${base}/menus/${id}/remove`, {
      json: { expected_updated_at },
    })
    return response.data
  },

  async reorderMenus(parentId: number, order: readonly number[], expected_updated_at?: string) {
    const response = await apiClient.put(`${base}/menus/${parentId}/order`, {
      json: { order: [...order], expected_updated_at },
    })
    return response.data
  },

  async moveMenu(id: number, input: MenuMoveInput) {
    const response = await apiClient.post(`${base}/menus/${id}/move`, { json: input })
    return response.data
  },

  async listRouteTargets(signal?: AbortSignal): Promise<readonly string[]> {
    const response = await apiClient.get<{ route_targets: readonly string[] }>(`${base}/route-targets`, { signal })
    return response.data.route_targets
  },
}
