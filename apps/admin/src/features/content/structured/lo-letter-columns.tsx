import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { StatusBadge, type StatusTone } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AudioPlaybackButton } from './audio-playback-button'
import type { LaoLetterListItem } from './contracts'

const letterTypeLabels: Readonly<Record<string, string>> = {
  consonant: '辅音', vowel: '元音', tone_mark: '声调符号', other: '其他标记',
}
const revisionStatusLabels: Readonly<Record<string, string>> = {
  draft: '草稿', pending_review: '待审核', approved: '已批准', rejected: '已驳回',
}
const statusTones: Readonly<Record<string, StatusTone>> = {
  active: 'success', disabled: 'muted', archived: 'muted', draft: 'muted',
  pending_review: 'warning', approved: 'info', rejected: 'danger',
}

export const LAO_LETTER_HIDEABLE_COLUMN_IDS = [
  'character', 'audio', 'content_status', 'working_revision_status', 'letter_type',
  'letter_class', 'name', 'romanization', 'sort_order',
] as const

export function createLaoLetterColumns(
  onRowAction: (row: LaoLetterListItem) => void,
): ColumnDef<LaoLetterListItem>[] {
  return [
  {
    id: 'select',
    enableHiding: false,
    header: ({ table }) => <Checkbox aria-label="选择本页字母" checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))} />,
    cell: ({ row }) => <Checkbox aria-label={`选择 ${row.original.character}`} checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))} />,
  },
  {
    accessorKey: 'sort_order',
    header: ({ column }) => <DataTableColumnHeader column={column} title="排序" />,
    cell: ({ row }) => row.original.sort_order ?? '—',
  },
  {
    accessorKey: 'character',
    header: ({ column }) => <DataTableColumnHeader column={column} title="字符" />,
    cell: ({ row }) => <span className="text-lg font-semibold">{row.original.character}</span>,
  },
  { accessorKey: 'romanization', header: ({ column }) => <DataTableColumnHeader column={column} title="音标" />, cell: ({ row }) => row.original.romanization ?? '—' },
  { id: 'audio', header: '音频', cell: ({ row }) => <AudioPlaybackButton audio={row.original.audio} label={row.original.character} rowId={row.original.content_id} /> },
  { accessorKey: 'content_status', header: '内容状态', cell: ({ row }) => <StatusBadge tone={statusTones[row.original.content_status]} label={row.original.content_status} /> },
  {
    accessorKey: 'working_revision_status',
    header: '工作修订',
    cell: ({ row }) => {
      const status = row.original.working_revision_status
      return status ? <StatusBadge tone={statusTones[status]} label={revisionStatusLabels[status] ?? status} /> : '无'
    },
  },
  { accessorKey: 'letter_type', header: '字母类型', cell: ({ row }) => letterTypeLabels[row.original.letter_type] },
  { accessorKey: 'letter_class', header: '字母类别', cell: ({ row }) => row.original.letter_class ?? '—' },
  { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="名称" />, cell: ({ row }) => row.original.name ?? '—' },
  {
    id: 'actions',
    header: '操作',
    enableHiding: false,
    meta: { sticky: 'right' },
    cell: ({ row }) => <Button aria-label={`操作 ${row.original.character}`} size="sm" variant="ghost" onClick={() => onRowAction(row.original)}>操作</Button>,
  },
  ]
}

export const laoLetterColumns = createLaoLetterColumns(() => undefined)
