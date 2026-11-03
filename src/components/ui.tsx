import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <h1 className="mr-auto text-xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}

export function Empty({ icon: Icon, text, children }: { icon: LucideIcon; text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-4 py-12 text-center">
      <Icon size={24} className="text-mute" />
      <p className="text-sm text-mute">{text}</p>
      {children}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-mute">{hint}</span>}
    </label>
  )
}

// Nút chỉ có icon: luôn có tooltip + aria-label để dễ hiểu và dùng được bằng bàn phím/trình đọc.
export function IconButton({ label, icon: Icon, ...rest }: { label: string; icon: LucideIcon } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="btn btn-icon" title={label} aria-label={label} {...rest}>
      <Icon size={16} />
    </button>
  )
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="mr-auto text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
