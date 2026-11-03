import { Asterisk, Bot, MessageCircle, Sparkles, type LucideIcon } from 'lucide-react'

// Mỗi nhà cung cấp một icon line đơn sắc (không dùng logo/màu thương hiệu để giữ giao diện trắng đen).
const ICONS: Record<string, LucideIcon> = { claude: Asterisk, chatgpt: MessageCircle, gemini: Sparkles }

export default function ProviderIcon({ id, size = 16, framed = false }: { id: string; size?: number; framed?: boolean }) {
  const Icon = ICONS[id] ?? Bot
  if (!framed) return <Icon size={size} />
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line"><Icon size={size} /></span>
}
