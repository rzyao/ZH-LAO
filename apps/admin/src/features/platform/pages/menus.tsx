import * as React from 'react'
import { DndContext, PointerSensor, type DragEndEvent, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Layers3 } from 'lucide-react'
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
  useMoveMenu,
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

type DropTarget = { parentId: number | null; position: number }

function DropZone({ target }: { target: DropTarget }) {
  const { isOver, setNodeRef } = useDroppable({ id: `drop:${target.parentId ?? 'root'}:${target.position}`, data: target })
  return <div ref={setNodeRef} className={`mx-2 h-2 rounded transition-colors ${isOver ? 'bg-primary/40 ring-1 ring-primary' : 'bg-transparent'}`} />
}

function TreeNode({ node, depth, index, parentId, onEdit, onAddChild, onRemove, onMoveChild }: {
  node: MenuTreeNode
  depth: number
  index: number
  parentId: number | null
  onEdit: (node: MenuTreeNode) => void
  onAddChild: (node: MenuTreeNode) => void
  onRemove: (node: MenuTreeNode) => void
  onMoveChild: (parentId: number, childId: number, direction: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(node.id), data: { nodeId: node.id } })
  const { setNodeRef: setChildDropRef, isOver: isOverChild } = useDroppable({ id: `child:${node.id}`, data: { parentId: node.id, position: node.children.length } satisfies DropTarget })
  return (
    <React.Fragment>
      <DropZone target={{ parentId, position: index }} />
      <div ref={setNodeRef} style={{ paddingLeft: `${depth * 1.5 + 0.5}rem`, transform: CSS.Translate.toString(transform) }} className={`flex items-center gap-2 rounded-lg border px-2 py-2 transition ${isDragging ? 'opacity-40 shadow-lg' : 'border-transparent hover:border-border hover:bg-muted/60'}`}>
        <button type="button" aria-label={`拖动 ${node.label}`} className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing" {...attributes} {...listeners}><GripVertical className="size-4" /></button>
        <span className="w-4 text-muted-foreground">{depth > 0 ? '└' : ''}</span>
        <span className="flex-1 truncate text-sm">{node.label}</span>
        {node.routeKey ? <code className="shrink-0 text-xs text-muted-foreground">{node.routeKey}</code> : null}
        <StatusBadge tone={MENU_STATUS_TONES[node.status] ?? 'muted'} label={node.status} />
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="outline" onClick={() => onEdit(node)}>编辑</Button>
          <Button size="sm" variant="ghost" onClick={() => onAddChild(node)}>新建子项</Button>
          <Button size="sm" variant="destructive" onClick={() => onRemove(node)} disabled={node.status === 'removed'}>删除</Button>
        </div>
      </div>
      <div ref={setChildDropRef} className={`ml-4 rounded-md ${isOverChild ? 'bg-primary/10 ring-1 ring-primary/40' : ''}`}>
      {node.children.map((child, childIndex) => (
        <div key={child.id} className="group relative">
          <TreeNode node={child} depth={depth + 1} index={childIndex} parentId={node.id} onEdit={onEdit} onAddChild={onAddChild} onRemove={onRemove} onMoveChild={onMoveChild} />
          <div className="absolute right-2 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="sm" variant="ghost" className="h-6 px-1" disabled={childIndex === 0} onClick={() => onMoveChild(node.id, child.id, -1)} title="上移">↑</Button>
            <Button size="sm" variant="ghost" className="h-6 px-1" disabled={childIndex === node.children.length - 1} onClick={() => onMoveChild(node.id, child.id, 1)} title="下移">↓</Button>
          </div>
        </div>
      ))}
      </div>
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
  const moveMutation = useMoveMenu()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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

  /** 同级排序：将 parentId 下的直接子项与相邻项交换后整体提交。 */
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

  const layerStamp = React.useCallback((parentId: number | null): string => {
    const findChildren = (nodes: readonly MenuTreeNode[]): readonly MenuTreeNode[] | null => {
      if (parentId === null) return nodes
      for (const node of nodes) {
        if (node.id === parentId) return node.children
        const found = findChildren(node.children)
        if (found) return found
      }
      return null
    }
    const children = findChildren(query.data ?? []) ?? []
    const latest = children.reduce<string>((value, node) => value > node.updatedAt ? value : node.updatedAt, '')
    if (latest || parentId === null) return latest
    return flatList.find((node) => node.id === parentId)?.updatedAt ?? ''
  }, [query.data, flatList])

  const handleDragEnd = React.useCallback(({ active, over }: DragEndEvent) => {
    const target = over?.data.current as DropTarget | undefined
    const id = Number(active.id)
    const node = flatList.find((item) => item.id === id)
    if (!target || !node || !node.updatedAt) return
    const parentByChild = (nodes: readonly MenuTreeNode[], childId: number, parentId: number | null = null): number | null | undefined => {
      for (const item of nodes) {
        if (item.id === childId) return parentId
        const found = parentByChild(item.children, childId, item.id)
        if (found !== undefined) return found
      }
      return undefined
    }
    const sourceParentId = parentByChild(query.data ?? [], id)
    if (sourceParentId === undefined) return
    const sourceStamp = layerStamp(sourceParentId)
    const targetStamp = layerStamp(target.parentId)
    if (!sourceStamp || !targetStamp) return
    moveMutation.mutate({ id, parent_id: target.parentId, position: target.position, expected_updated_at: node.updatedAt, source_layer_updated_at: sourceStamp, target_layer_updated_at: targetStamp }, {
      onSuccess: () => toast.success({ title: '菜单位置已保存' }),
      onError: fail,
    })
  }, [flatList, query.data, layerStamp, moveMutation, toast, fail])

  return (
    <ListPageLayout
      title="菜单与路由管理"
      description="后台侧边栏目录配置。所有节点使用同一种模型，可自由嵌套、排序和移动；目标路由受白名单约束。"
      breadcrumb={[{ label: '系统运维' }, { label: '平台控制台', href: '/platform' }, { label: '菜单管理' }]}
      actions={<Button disabled={!canWrite} onClick={() => setEditor({ open: true, node: null, asChild: false })}>新建菜单</Button>}
    >
      <div className="space-y-4 p-4 sm:p-6">
        <PermissionContract read={PLATFORM_PERMISSIONS.menusRead} write={PLATFORM_PERMISSIONS.menusWrite} />
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <Layers3 className="size-4 text-primary" />
          <span className="text-xs text-muted-foreground">目标路由白名单来源:</span>
          <code className="text-xs">{routeTargetsQuery.data?.length ?? 0} 个已注册页面</code>
        </div>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="space-y-1 rounded-xl border bg-card p-2 shadow-sm">
          {(query.data ?? []).map((node, index) => (
            <div key={node.id} className="group relative">
              <TreeNode
                node={node}
                depth={0}
                index={index}
                parentId={null}
                onEdit={(item) => setEditor({ open: true, node: item, asChild: false })}
                onAddChild={(parent) => setEditor({ open: true, node: parent, asChild: true })}
                onRemove={setRemoving}
                onMoveChild={moveChild}
              />
              <div className="absolute right-2 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="sm" variant="ghost" className="h-6 px-1" disabled={index === 0} onClick={() => moveChild(0, node.id, -1)} title="上移">↑</Button>
                <Button size="sm" variant="ghost" className="h-6 px-1" disabled={index === (query.data?.length ?? 0) - 1} onClick={() => moveChild(0, node.id, 1)} title="下移">↓</Button>
              </div>
            </div>
          ))}
          <DropZone target={{ parentId: null, position: (query.data ?? []).length }} />
        </div>
        </DndContext>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">拖住左侧把手排序或放入任意目录。无路由节点为目录；带路由节点也可继续包含子项。嵌套层级不作业务限制，变更保存即生效。</span>
        </div>
      </div>

      <MenuEditorDialog
        open={editor.open}
        node={editor.asChild ? null : editingNode}
        onOpenChange={(open) => !open && setEditor({ open: false, node: null, asChild: false })}
        pending={createMutation.isPending || updateMutation.isPending || moveMutation.isPending}
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

function MenuEditorDialog({ open, node, onOpenChange, pending, onSubmit }: {
  open: boolean
  node: MenuTreeNode | null
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{node ? '编辑菜单项' : '新建菜单项'}</DialogTitle>
          <DialogDescription>路由可选；留空即为容器。节点无论是否带路由都可拥有子项。</DialogDescription>
        </DialogHeader>
        <form
          id="menu-editor"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const permissionKeys = permissions.split(',').map((s) => s.trim()).filter(Boolean)
            onSubmit({
              label,
              route_key: routeKey || null,
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
              <option value="">(容器,无跳转)</option>
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
