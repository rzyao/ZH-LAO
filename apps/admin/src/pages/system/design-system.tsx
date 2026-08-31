import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { createUuid, formatDateTime } from '@/api/contracts'
import type { Uuid } from '@/api/contracts'
import { PageHeader } from '@/components/common/page-header'
import { Card } from '@/components/common/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/common/status-badge'
import type { StatusTone } from '@/components/common/status-badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/form/form'
import { FormSection } from '@/components/form/form-section'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from '@/components/data-table/data-table-row-actions'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineLoading } from '@/components/feedback/loading'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useToast } from '@/components/feedback/use-toast'
import { PermissionGuard } from '@/auth/guards/PermissionGuard'
import { useAuth } from '@/auth/context/AuthContext'
import type { Permission } from '@/auth/permissions'

/* ---------- Neutral demo data (NOT business data) ---------- */

interface DemoRow {
  id: Uuid
  code: string
  title: string
  status: 'active' | 'pending' | 'inactive'
  createdAt: string
}

const DEMO_STATUS_TONE: Record<DemoRow['status'], StatusTone> = {
  active: 'success',
  pending: 'warning',
  inactive: 'muted',
}

function buildDemoRows(count: number): DemoRow[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: createUuid(),
    code: `DEMO-${String(index + 1).padStart(4, '0')}`,
    title: `示例记录 ${index + 1}`,
    status: (['active', 'pending', 'inactive'] as const)[index % 3],
    createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
  }))
}

const demoColumns: ColumnDef<DemoRow>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="编码" />,
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('code')}</span>,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="标题" />,
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => (
      <StatusBadge tone={DEMO_STATUS_TONE[row.original.status]} label={row.original.status} />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDateTime(row.getValue('createdAt'))}</span>
    ),
  },
  {
    id: 'actions',
    header: undefined,
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          { label: '查看', onClick: () => undefined },
          { label: '删除', variant: 'destructive', onClick: () => undefined },
        ]}
      />
    ),
  },
]

/* ---------- Demo form ---------- */

const demoFormSchema = z.object({
  name: z.string().min(2, '至少输入 2 个字符'),
  description: z.string().max(100, '最多 100 个字符').optional(),
  category: z.enum(['standard', 'premium', 'internal']),
  enabled: z.boolean(),
})

type DemoFormValues = z.infer<typeof demoFormSchema>

/* ---------- Page ---------- */

function TypographySection() {
  return (
    <Card title="Typography">
      <div className="space-y-2">
        <p className="text-lg font-semibold">Page Title — text-lg / semibold</p>
        <p className="text-base font-semibold">Section Title — text-base / semibold</p>
        <p className="text-sm font-medium">Body — text-sm / normal</p>
        <p className="text-sm text-muted-foreground">Muted body — text-sm / muted</p>
        <p className="text-xs text-muted-foreground">Caption — text-xs / muted</p>
        <p className="font-mono text-xs text-muted-foreground">mono / code — 0a1b2c3d</p>
      </div>
    </Card>
  )
}

function ButtonsSection() {
  return (
    <Card title="Button">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button loading>Loading</Button>
        <Button size="sm">Small</Button>
        <Button size="icon" aria-label="icon">
          +
        </Button>
        <Button disabled>Disabled</Button>
      </div>
    </Card>
  )
}

function InputsSection() {
  return (
    <Card title="Input / Textarea / Select / Checkbox / Switch">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="demo-input">输入框</Label>
          <Input id="demo-input" placeholder="输入内容" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-invalid">校验错误</Label>
          <Input id="demo-invalid" aria-invalid placeholder="必填" />
          <p className="text-xs font-medium text-destructive">该字段为必填项</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-textarea">多行文本</Label>
          <Textarea id="demo-textarea" placeholder="描述…" />
        </div>
        <div className="space-y-1.5">
          <Label>下拉选择</Label>
          <Select defaultValue="standard">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">标准</SelectItem>
              <SelectItem value="premium">高级</SelectItem>
              <SelectItem value="internal">内部</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked />
            复选框
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch defaultChecked />
            开关
          </label>
        </div>
      </div>
    </Card>
  )
}

function BadgesSection() {
  return (
    <Card title="Badge / StatusBadge">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <StatusBadge tone="success" label="Published" />
        <StatusBadge tone="warning" label="Pending" />
        <StatusBadge tone="danger" label="Failed" />
        <StatusBadge tone="info" label="Processing" />
        <StatusBadge tone="muted" label="Archived" />
      </div>
    </Card>
  )
}

function DataTableSection() {
  const [rows] = React.useState(() => buildDemoRows(23))
  return (
    <Card title="DataTable（中性示例数据）">
      <DataTable
        columns={demoColumns}
        data={rows}
        enableRowSelection
        initialSorting={[{ id: 'code', desc: false }]}
        emptyTitle="暂无示例数据"
      />
    </Card>
  )
}

function FormSectionDemo() {
  const { toast } = useToast()
  const form = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'standard',
      enabled: true,
    },
  })

  function onSubmit(values: DemoFormValues) {
    toast({ title: '表单已提交（示例）', description: values.name })
  }

  return (
    <Card title="Form（React Hook Form + Zod）">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormSection title="基本信息" description="字段校验为 UX 提示，服务器仍是最终权威">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input placeholder="名称" {...field} />
                  </FormControl>
                  <FormDescription>至少 2 个字符</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="描述…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">标准</SelectItem>
                        <SelectItem value="premium">高级</SelectItem>
                        <SelectItem value="internal">内部</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>启用</FormLabel>
                    <FormDescription>演示开关字段</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormSection>
          <div className="flex items-center gap-2">
            <Button type="submit" loading={form.formState.isSubmitting}>
              提交
            </Button>
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              重置
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}

function OverlaysSection() {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const { toast } = useToast()
  return (
    <Card title="Dialog / Sheet / Toast / Confirm">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger render={<Button variant="outline">打开 Dialog</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认操作</DialogTitle>
              <DialogDescription>
                这是一个基于 Base UI 的标准对话框示例。
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">对话框内容区域。</div>
            <DialogFooter>
              <Button variant="outline">取消</Button>
              <Button>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger render={<Button variant="outline">打开 Sheet</Button>} />
          <SheetContent>
            <SheetHeader>
              <SheetTitle>侧边面板</SheetTitle>
              <SheetDescription>基于 Base UI Drawer 的 Sheet 示例。</SheetDescription>
            </SheetHeader>
            <div className="text-sm text-muted-foreground">面板内容。</div>
          </SheetContent>
        </Sheet>

        <Button variant="outline" onClick={() => setConfirmOpen(true)}>
          确认对话框
        </Button>
        <Button
          variant="outline"
          onClick={() => toast({ title: '操作成功', variant: 'success' })}
        >
          成功 Toast
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast({ title: '发生错误', description: '演示错误通知', variant: 'danger' })
          }
        >
          错误 Toast
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认删除？"
        description="该操作不可撤销（示例）。"
        destructive
        confirmLabel="删除"
        onConfirm={() => {
          setConfirmOpen(false)
          toast({ title: '已删除（示例）', variant: 'success' })
        }}
      />
    </Card>
  )
}

function FeedbackSection() {
  const [errorState, setErrorState] = React.useState<{ show: boolean; retries: number }>({
    show: false,
    retries: 0,
  })
  return (
    <Card title="Loading / Skeleton / Empty / Error">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <InlineLoading label="页面加载" />
          </div>
          <Button
            variant="outline"
            onClick={() => setErrorState({ show: true, retries: 0 })}
          >
            显示 ErrorState
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          {errorState.show ? (
            <ErrorState
              title="加载失败"
              message="演示错误状态，包含重试与请求 ID。"
              requestId={createUuid()}
              onRetry={() =>
                setErrorState((state) => ({ show: true, retries: state.retries + 1 }))
              }
            />
          ) : (
            <EmptyState
              title="暂无数据"
              description="演示空状态，后续业务列表复用该组件。"
            />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          重试次数：{errorState.retries}
        </div>
      </div>
    </Card>
  )
}

function PermissionSection() {
  const { status, operator, setAuthenticated, signOut } = useAuth()
  const permission: Permission = 'content.course.read'

  return (
    <Card
      title="Auth / Permission Skeleton"
      description="登录态与 Operations 权限由服务端统一校验"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StatusBadge
            tone={status === 'authenticated' ? 'success' : 'muted'}
            label={status === 'authenticated' ? `已登录：${operator?.name ?? ''}` : '未登录（anonymous）'}
          />
          {status !== 'authenticated' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAuthenticated(
                  { id: createUuid(), name: '演示运营' },
                  [permission],
                )
              }
            >
              模拟登录（测试骨架）
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={signOut}>
              退出（模拟）
            </Button>
          )}
        </div>
        <Separator />
        <div className="text-sm">
          <p className="mb-2 text-muted-foreground">
            权限 key：<code className="font-mono text-xs">{permission}</code>
          </p>
          <PermissionGuard permission={permission}>
            <div className="rounded-md border border-success/40 bg-success/5 p-3 text-sm text-success">
              已授权，此内容可访问。
            </div>
          </PermissionGuard>
        </div>
      </div>
    </Card>
  )
}

export function DesignSystemPage({ section }: { section?: string }) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Design System"
        description="Admin Foundation 组件展示（不含业务数据）"
        breadcrumb={[{ label: 'Overview', href: '/' }, { label: 'Development' }, { label: 'Design System' }]}
      />
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          URL State 示例：当前 <code className="font-mono">?section=</code> ={' '}
          <code className="font-mono">{section ?? 'overview'}</code>（列表状态应可通过 URL 保存与分享）
        </div>
        <TypographySection />
        <ButtonsSection />
        <InputsSection />
        <BadgesSection />
        <DataTableSection />
        <FormSectionDemo />
        <OverlaysSection />
        <FeedbackSection />
        <PermissionSection />
      </div>
    </div>
  )
}
