import {
  AudioLines,
  BookOpen,
  CircleUser,
  CreditCard,
  Database,
  FileText,
  Gift,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** lucide key → 组件映射。未知 key 回退 FallbackIcon,前端渲染不崩溃。 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  audio_lines: AudioLines,
  book_open: BookOpen,
  circle_user: CircleUser,
  credit_card: CreditCard,
  database: Database,
  file_text: FileText,
  gift: Gift,
  graduation_cap: GraduationCap,
  layout_dashboard: LayoutDashboard,
  message_square: MessageSquare,
  settings: Settings,
  shield_check: ShieldCheck,
  sliders_horizontal: SlidersHorizontal,
  smartphone: Smartphone,
  users: Users,
}

export function resolveIcon(key: string | null | undefined): LucideIcon {
  if (key && ICON_REGISTRY[key]) return ICON_REGISTRY[key]
  return LayoutDashboard
}
