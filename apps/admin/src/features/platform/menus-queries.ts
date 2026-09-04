import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { menusApi, type MenuCreateInput, type MenuMoveInput, type MenuUpdateInput } from './menus-api'
import type { MenuTreeNode } from '@/navigation/types'

export const menusQueryKeys = {
  root: ['platform-admin', 'menus'] as const,
  routeTargets: () => [...menusQueryKeys.root, 'route-targets'] as const,
}

function invalidateMenus(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: menusQueryKeys.root })
}

export interface UseMenusQueryOptions {
  enabled?: boolean
}

export function useMenusQuery(options?: UseMenusQueryOptions) {
  return useQuery({
    queryKey: menusQueryKeys.root,
    queryFn: ({ signal }) => menusApi.listMenus(signal),
    enabled: options?.enabled,
    // 菜单决定页面是否可达，进入后台和重新聚焦时都读取最新配置，
    // 避免数据库迁移或后台改菜单后仍显示会话中的旧导航。
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}

export function useRouteTargetsQuery() {
  return useQuery({
    queryKey: menusQueryKeys.routeTargets(),
    queryFn: ({ signal }) => menusApi.listRouteTargets(signal),
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MenuCreateInput) => menusApi.createMenu(input),
    onSuccess: () => invalidateMenus(queryClient),
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: number } & MenuUpdateInput) => menusApi.updateMenu(input.id, input),
    onSuccess: () => invalidateMenus(queryClient),
  })
}

export function useRemoveMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: number; expected_updated_at?: string }) =>
      menusApi.removeMenu(input.id, input.expected_updated_at),
    onSuccess: () => invalidateMenus(queryClient),
  })
}

export function useReorderMenus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { parentId: number; order: readonly number[]; expected_updated_at?: string }) =>
      menusApi.reorderMenus(input.parentId, input.order, input.expected_updated_at),
    onSuccess: () => invalidateMenus(queryClient),
  })
}

export function useMoveMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: number } & MenuMoveInput) => menusApi.moveMenu(input.id, input),
    onSuccess: () => invalidateMenus(queryClient),
  })
}

export type { MenuTreeNode }
