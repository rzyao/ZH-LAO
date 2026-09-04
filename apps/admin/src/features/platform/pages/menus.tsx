import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { StatusBadge } from '@/components/common/status-badge'
import type { StatusTone } from '@/components/common/status-badge'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useToastApi } from '@/components/feedback/use-toast'
import { FormField, NativeSelect, PermissionContract, mutationErrorMessage, useExactPermission } from '../components'
import { PLATFORM_PERMISSIONS } from '../contracts'
import {
  useCreateMenu,
  useMenusQuery,
  useRemoveMenu,
  useReorderMenus,
  useUpdateMenu,
  useRouteTargetsQuery,
} from '../menus-queries'
import { ADMIN_ROUTE_TARGETS } from '@/navigation/route-registry'
import type { MenuTreeNode } from '@/navigation/types'

const MENU_STATUS_TONES: Record<MenuTreeNode['status'], StatusTone> = {
  active: 'success',
  disabled: 'muted',
  removed: 'muted',
}

function TreeNode({ node, depth, onEdit, onRemove, onMoveChild }: {
  node: MenuTreeNode
  depth: number
  onEdit: (node: MenuTreeNode) => void
  onRemove: (node: MenuTreeNode) => void
  onMoveChild: (parentId: number, childId: number, direction: -1 | 1) => void
}) {
  return (
    <React.Fragment>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50" style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}>
        <span className="w-4 text-muted-foreground">{depth > 0 ? '└' : ''}</span>
        <span className="flex-1 truncate text-sm">{node.label}</span>
        {node.routeKey ? <code className="shrink-0 text-xs text-muted-foreground">{node.routeKey}</code> : null}
        <StatusBadge tone={MENU_STATUS_TONES[node.status] ?? 'muted'} label={node.status} />
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="outline" onClick={() => onEdit(node)}>编辑</Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit({ ...node, children: [], label: node.label, routeKey: node.routeKey })}>子项</Button>
          <Button size="sm" variant="destructive" onClick={() => onRemove(node)} disabled={node.status === 'removed'}>删除</Button>
        </div>
      </div>
      {node.children.map((child, index) => (
        <div key={child.id} className="group relative">
          <TreeNode node={child} depth={depth + 1} onEdit={onEdit} onRemove={onRemove} onMoveChild={onMoveChild} />
          {depth + 1 <= 2 ? (
            <div className="absolute right-2 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button size="sm" variant="ghost" className="h-6 px-1" disabled={index === 0} onClick={() => onMoveChild(node.id, child.id, -1)} title="上移">↑</Button>
              <Button size="sm" variant="ghost" className="h-6 px-1" disabled={index === node.children.length - 1} onClick={() => onMoveChild(node.id, child.id, 1)} title="下移">↓</Button>
            </div>
          ) : null}
        </div>
      ))}
    </React.Fragment>
  )
}

export function MenusPage() {
  const query = useMenusQuery()
  const routeTargetsQuery = useRouteTargetsQuery()
  const canWrite = useExactPermission(PLATFORM_PERMISSIONS.menusWrite)
  const toast = useToastApi()
  const createMutation = useCreateMenu()
  const updateMutation = useUpdateMenu()
  const removeMutation = useRemoveMenu()
  const reorderMutation = useReorderMenus()

  const [editor, setEditor] = React.useState<{ open: boolean; node: MenuTreeNode | null; asChild: boolean }>({ open: false, node: null, asChild: false })
  const [removing, setRemoving] = React.useState<MenuTreeNode | null>(null)
  const fail = (error: unknown) => toast.error({ title: '菜单操作失败', description: mutationErrorMessage(error) })

  const flatList = React.useMemo(() => {
    const out: MenuTreeNode[] = []
    const walk = (nodes: readonly MenuTreeNode[]) => {
      for (const n of nodes) {
        out.push(n)
        walk(n.children)
      }
    }
    walk(query.data ?? [])
    return out
  }, [query.data])

  const editingId = editor.node?.id
  const editingNode = flatList.find((n) => n.id === editingId) ?? null
  const editingParentId = editor.asChild && editor.node ? (editor.node.children.length > 0 ? null : editor.node.id) : null

  /** 组内排序: 将 parentId 下的直接子项按当前顺序交换 childId 与相邻项后整体提交(FE-006)。 */
  const moveChild = React.useCallback((parentId: number, childId: number, direction: -1 | 1) => {
    const findChildren = (nodes: readonly MenuTreeNode[]): readonly MenuTreeNode[] | null => {
      for (const n of nodes) {
        if (n.id === parentId) return n.children
        const found = findChildren(n.children)
        if (found) return found
      }
      return null
    }
    const siblings = parentId === 0 ? (query.data ?? []) : findChildren(query.data ?? [])
    if (!siblings || siblings.length < 2) return
    const index = siblings.findIndex((n) => n.id === childId)
    const swapIndex = index + direction
    if (index < 0 || swapIndex < 0 || swapIndex >= siblings.length) return

    const order = siblings.map((n) => n.id)
    ;[order[index]!, order[swapIndex]!] = [order[swapIndex]!, order[index]!]

    // 乐观并发: 以该层最近 updated_at 作为 expected_updated_at(SC-005)
    const layerUpdatedAt = siblings.reduce<Date | null>(
      (acc, n) => {
        const t = new Date(n.updatedAt)
        return acc === null || t > acc ? t : acc
      },
      null,
    )

    reorderMutation.mutate({
      parentId,
      order,
      expected_updated_at: layerUpdatedAt ? layerUpdatedAt.toISOString() : undefined,
    }, {
      onSuccess: () => toast.success({ title: '排序已保存' }),
      onError: fail,
    })
  }, [query.data, reorderMutation, toast, fail])

  return (
    <ListPageLayout
      title="菜单与路由管理"
      description="后台侧边栏菜单配置。目标路由受白名单约束;可见性权限多权限任一匹配(OR)控制。"
      breadcrumb={[{ label: '系统运维' }, { label: '平台控制台', href: '/platform' }, { label: '菜单管理' }]}
      actions={<Button disabled={!canWrite} onClick={() => setEditor({ open: true, node: null, asChild: false })}>新建菜单</Button>}
    >
      <div className="p-4">
        <PermissionContract read={PLATFORM_PERMISSIONS.menusRead} write={PLATFORM_PERMISSIONS.menusWrite} />
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">目标路由白名单来源:</span>
          <code className="text-xs">{routeTargetsQuery.data?.length ?? 0} 个已注册页面</code>
        </div>
        <div className="space-y-1 rounded-md border p-2">
          {(query.data ?? []).map((group, index) => (
            <div key={group.id} className="group relative">
              <TreeNode node={group} depth={0} onEdit={(node) => setEditor({ open: true, node, asChild: false })} onRemove={setRemoving} onMoveChild={moveChild} />
              <div className="absolute right-2 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="sm" variant="ghost" className="h-6 px-1" disabled={index === 0} onClick={() => moveChild(0, group.id, -1)} title="上移">↑</Button>
                <Button size="sm" variant="ghost" className="h-6 px-1" disabled={index === (query.data?.length ?? 0) - 1} onClick={() => moveChild(0, group.id, 1)} title="下移">↓</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">排序: 将鼠标悬停在任意菜单项上,使用 ↑/↓ 调整同级顺序;变更保存即生效。</span>
        </div>
      </div>

      <MenuEditorDialog
        open={editor.open}
        node={editingNode}
        parentId={editingParentId}
        onOpenChange={(open) => !open && setEditor({ open: false, node: null, asChild: false })}
        pending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(input) => {
          if (editingNode) {
            updateMutation.mutate({ id: editingNode.id, ...input }, {
              onSuccess: () => { setEditor({ open: false, node: null, asChild: false }); toast.success({ title: '菜单已更新' }) },
              onError: fail,
            })
          } else {
            createMutation.mutate({ ...input, parent_id: editor.asChild ? editor.node!.id : null }, {
              onSuccess: () => { setEditor({ open: false, node: null, asChild: false }); toast.success({ title: '菜单已创建' }) },
              onError: fail,
            })
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="确认删除该菜单？"
        description="删除为终态,含全部子项一并移除(审计保留,不物理删除)。"
        confirmLabel="确认删除"
        destructive
        loading={removeMutation.isPending}
        onConfirm={() => removing && removeMutation.mutate({ id: removing.id }, {
          onSuccess: () => { setRemoving(null); toast.success({ title: '菜单已删除' }) },
          onError: fail,
        })}
      />
    </ListPageLayout>
  )
}

function MenuEditorDialog({ open, node, parentId, onOpenChange, pending, onSubmit }: {
  open: boolean
  node: MenuTreeNode | null
  parentId: number | null
  onOpenChange: (open: boolean) => void
  pending: boolean
  onSubmit: (input: {
    label: string
    route_key: string | null
    icon: string | null
    sort_order: number
    status?: 'active' | 'disabled'
    permissions: readonly string[]
    expected_updated_at?: string
  }) => void
}) {
  const [label, setLabel] = React.useState('')
  const [routeKey, setRouteKey] = React.useState('')
  const [icon, setIcon] = React.useState('')
  const [sortOrder, setSortOrder] = React.useState(0)
  const [status, setStatus] = React.useState<'active' | 'disabled'>('active')
  const [permissions, setPermissions] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setLabel(node?.label ?? '')
      setRouteKey(node?.routeKey ?? '')
      setIcon(node?.icon ?? '')
      setSortOrder(node?.sortOrder ?? 0)
      setStatus(node?.status === 'disabled' ? 'disabled' : 'active')
      setPermissions(node?.permissions?.join(', ') ?? '')
    }
  }, [open, node])

  const isGroup = node === null && parentId === null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{node ? '编辑菜单项' : '新建菜单项'}</DialogTitle>
          <DialogDescription>{isGroup ? '作为顶层分组创建。' : '目标路由必须从已注册页面白名单中选择。'}</DialogDescription>
        </DialogHeader>
        <form
          id="menu-editor"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const permissionKeys = permissions.split(',').map((s) => s.trim()).filter(Boolean)
            onSubmit({
              label,
              route_key: isGroup && !routeKey ? null : routeKey,
              icon: icon || null,
              sort_order: sortOrder,
              status,
              permissions: permissionKeys,
              expected_updated_at: node?.updatedAt,
            })
          }}
        >
          <FormField label="显示名称" htmlFor="menu-label" error={!label.trim() ? '必填' : undefined}>
            <Input id="menu-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：平台控制台" />
          </FormField>
          <FormField label="目标路由 (Route Key)" htmlFor="menu-route">
            <NativeSelect id="menu-route" value={routeKey} onChange={(e) => setRouteKey(e.target.value)}>
              <option value="">{isGroup ? '(分组,无跳转)' : '请选择目标路由'}</option>
              {ADMIN_ROUTE_TARGETS.map((target) => (
                <option key={target.key} value={target.key}>{target.label} ({target.key})</option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="图标 Key" htmlFor="menu-icon">
            <Input id="menu-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="如 layout_dashboard,留空用默认" />
          </FormField>
          <FormField label="排序值" htmlFor="menu-sort">
            <Input id="menu-sort" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
          </FormField>
          {node ? (
            <FormField label="状态" htmlFor="menu-status">
              <NativeSelect id="menu-status" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'disabled')}>
                <option value="active">active (启用)</option>
                <option value="disabled">disabled (停用)</option>
              </NativeSelect>
            </FormField>
          ) : null}
          <FormField label="可见性权限 (逗号分隔, 任一匹配 OR)" htmlFor="menu-permissions">
            <Input id="menu-permissions" value={permissions} onChange={(e) => setPermissions(e.target.value)} placeholder="例：operations.operators.read, operations.roles.read" />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="submit" form="menu-editor" loading={pending}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
